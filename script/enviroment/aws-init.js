#!/usr/bin/env node
'use strict';

/**
 * @module CLI
 * */

process.env.NODE_ENV = 'development';

const AWS = require('aws-sdk');
const config = require('../../config');
const logger = require('../../logger');

const iam = new AWS.IAM();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const cloudwatchevents = new AWS.CloudWatchEvents();

const AWS_CONFIG = config.aws;

if (require.main === module) {
  constructAWSEnvironment().then(() => {
    console.log('Success create AWS');
  }).catch((err) => {
    if (err) {
      logger.log({err: err}, 'Unexpected Error!');
      process.exit(-1);
    }
    console.log('Environment already constructed');
  });
}

function constructAWSEnvironment () {
  let constructAWSJobs = [];
  constructAWSJobs.push(constructIAMRole());
  constructAWSJobs.push(constructSchedulerOnCloudWatchEvent());
  constructAWSJobs.push(constructCronJobLambda());
  constructAWSJobs.push(constructDynamoDB());
  constructAWSJobs.push(constructExpressLambda());
  constructAWSJobs.push(constructAPIGateWay());
  return seriesPromise(constructAWSJobs);
}

function constructIAMRole () {
  return shouldCreateIAMRole().then(() => {
    return iam.createRole({
      AssumeRolePolicyDocument: AWS_CONFIG.IAM_ROLE_TRUST_RELATIONSHIP,
      RoleName: AWS_CONFIG.IAM_ROLE_NAME
    }).promise()
      .then(() => {
        return iam.attachRolePolicy({
          PolicyArn: AWS_CONFIG.IAM_ROLE_POLICY,
          RoleName: AWS_CONFIG.IAM_ROLE_NAME
        }).promise();
      });
  });
}

function shouldCreateIAMRole () {
  return new Promise((resolve, reject) => {
    iam.listRoles({
      PathPrefix: '/'
    }).promise().then((data) => {
      for (let role of data.Roles) {
        if (role.Arn === AWS_CONFIG.IAM_ROLE_ARN) {
          reject(new Error('IAM already exist'));
          return;
        }
        resolve();
      }
    });
  });
}

function constructDynamoDB () {
  return shouldCreateDynamoDBTable().then(() => {
    return dynamodb.createTable({
      AttributeDefinitions: [
        {
          AttributeName: 'RateBase',
          AttributeType: 'S'
        },
        {
          AttributeName: 'RateDate',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'RateBase',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'RateDate',
          KeyType: 'RANGE'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      },
      TableName: AWS_CONFIG.DYNAMO_DB_TABLE_NAME
    }).promise();
  });
}

function shouldCreateDynamoDBTable () {
  return dynamodb.describeTable({
    TableName: AWS_CONFIG.DYNAMO_DB_TABLE
  }).promise().then(() => Promise.reject(new Error('DB Table Already exist')));
}

function constructExpressLambda () {
  return shouldCreateLambda(AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME).then(() => {
    return lambda.createFunction({
      Code: {
        S3Bucket: AWS_CONFIG.S3_LAMBDA_SOURCE_CODE_BUCKET,
        S3Key: AWS_CONFIG.S3_LAMBDA_SOURCE_CODE_PATH
      },
      FunctionName: AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME,
      Handler: 'lambda.handler',
      Role: AWS_CONFIG.IAM_ROLE_ARN,
      Runtime: 'nodejs6.10',
      Description: 'Currency exchange/convert API written in Express',
      MemorySize: 256,
      Publish: true,
      Timeout: 60,
      Environment: {
        Variables: {
          TZ: config.env.TZ,
          NODE_ENV: 'production'
        }
      }
    }).promise();
  });
}

function shouldCreateLambda (lambdaFunctionName) {
  return lambda.getFunction({
    FunctionName: lambdaFunctionName
  }).promise()
    .then(() => Promise.reject(new Error(`${lambdaFunctionName} already exist`)));
}

function constructAPIGateWay () {
  // TODO: Refactor this function. It too long and painful to understand
  // http://docs.aws.amazon.com/lambda/latest/dg/with-on-demand-https-example-configure-event-source.html
  return shouldSetupApiGateway().then(() => {
    return apigateway.createRestApi({
      name: AWS_CONFIG.API_GATEWAY_API_NAME,
      description: 'API for list least/historical exchange rate'
    }).promise()
      .then((data) => {
        return rootResourceSourceIDOfAPI(data.id);
      })
      .then((data) => {
        // Set up proxy api for lambda, any request will use that endpoint to communicate to lambda
        return apigateway.createResource({
          restApiId: data.restApiId,
          pathPart: '{proxy+}',
          parentId: data.resourceId
        }).promise().then((resourceData) => {
          return Promise.resolve({
            resourceId: resourceData.id,
            restApiId: data.restApiId
          });
        });
      })
      .then((data) => {
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          apiKeyRequired: false,
          requestParameters: {
            'method.request.path.proxy': true
          }
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        // http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html
        return apigateway.putIntegration({
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST', // API Gateway uses to communicate with AWS Lambda
          passthroughBehavior: 'WHEN_NO_MATCH',
          uri: `arn:aws:apigateway:${config.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME}/invocations`
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        return apigateway.putIntegrationResponse({
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          contentHandling: 'CONVERT_TO_TEXT',
          responseTemplates: {
            'application/json': null
          }
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        // http://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
        // Set up preflight method for wbe site AJAX request
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          apiKeyRequired: false
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        return apigateway.putIntegration({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          type: 'MOCK',
          integrationHttpMethod: 'POST', // API Gateway uses to communicate with AWS Lambda
          requestTemplates: {
            'application/json': null
          },
          passthroughBehavior: 'WHEN_NO_MATCH'
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        return apigateway.putMethodResponse({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          },
          responseModels: {
            'application/json': 'Empty'
          }
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        return apigateway.putIntegrationResponse({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
            'method.response.header.Access-Control-Allow-Methods': "'*'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          },
          responseTemplates: {
            'application/json': null
          }
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        // Enable APIGateway tester by allow tester invoke lambda
        return lambda.addPermission({
          Action: 'lambda:InvokeFunction',
          FunctionName: AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME,
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:${data.restApiId}/*/*/*`,
          StatementId: `apt-gateway-${data.restApiId}-lambda-integration-test`
        }).promise().then(() => { return Promise.resolve(data); });
      })
      .then((data) => {
        // Deploy apigateway to stage test.
        return apigateway.createDeployment({
          restApiId: data.restApiId,
          description: 'Initialize deployment',
          stageName: 'test',
          stageDescription: 'Testing environment'
        }).promise().then(() => {
          console.log(`API deployed to https://${data.restApiId}.execute-api.ap-northeast-1.amazonaws.com/test`);
          return Promise.resolve(data);
        });
      });
  });
}

function shouldSetupApiGateway () {
  return new Promise((resolve, reject) => {
    return apigateway.getRestApis({
      limit: 500
    }).promise().then((data) => {
      for (let item of data.items) {
        if (item.name === AWS_CONFIG.API_GATEWAY_API_NAME) {
          reject(new Error('APIGate way already exist'));
          return;
        }
      }
      resolve();
    });
  });
}

function rootResourceSourceIDOfAPI (restApiId) {
  return apigateway.getResources({
    restApiId: restApiId
  }).promise().then((data) => {
    let resource = data.items[0];
    return Promise.resolve({
      resourceId: resource.id,
      restApiId: restApiId
    });
  });
}

function seriesPromise (promiseJobs) {
  // TODO: Code will diplay UnhandledPromiseRejectionWarning while promiseJobs > 2, how to dismiss?
  return new Promise((resolve, reject) => {
    let promiseWillSeriesExecute = Promise.resolve();
    promiseJobs.forEach(function (promiseJob) {
      promiseWillSeriesExecute = promiseWillSeriesExecute
        .then(() => { return promiseJob.catch(Promise.reject); })
        .catch(Promise.reject);
    });
    promiseWillSeriesExecute.then(resolve).catch(reject);
  });
}

function constructSchedulerOnCloudWatchEvent () {
  return shouldCreateCloudWatchScheduler()
    .then(() => {
      return cloudwatchevents.putRule({
        Name: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME,
        Description: 'Will trigger on HKT 4a.m',
        ScheduleExpression: 'cron(0 20 ? * * *)',
        State: 'ENABLED'
      }).promise();
    });
}

function shouldCreateCloudWatchScheduler () {
  return new Promise((resolve, reject) => {
    return cloudwatchevents.listRules({
      NamePrefix: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME
    })
    .promise()
      .catch(resolve)
      .then((data) => {
        for (let rule of data.Rules) {
          if (rule.Name === AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME) {
            reject(new Error('IAM Role already exist'));
            return;
          }
        }
        resolve();
      });
  });
}

function constructCronJobLambda () {
  return shouldCreateLambda(AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME).then(() => {
    return lambda.createFunction({
      Code: {
        S3Bucket: AWS_CONFIG.S3_LAMBDA_SOURCE_CODE_BUCKET,
        S3Key: AWS_CONFIG.S3_LAMBDA_SOURCE_CODE_PATH
      },
      FunctionName: AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME,
      Handler: 'lambdaCron.handler',
      Role: AWS_CONFIG.AWS_CONFIG.IAM_ROLE_ARN,
      Runtime: 'nodejs6.10',
      Description: 'Will download exchange rate to dynamo DB',
      MemorySize: 512,
      Publish: true,
      Timeout: 300,
      Environment: {
        Variables: {
          TZ: config.env.TZ,
          NODE_ENV: 'production'
        }
      }
    }).promise()
      .then(() => {
        return lambda.addPermission({
          Action: 'lambda:InvokeFunction',
          FunctionName: AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME,
          Principal: 'events.amazonaws.com',
          SourceArn: `arn:aws:events:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:rule/${AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME}`,
          StatementId: `cloud-watch-event-${AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME}`
        }).promise();
      })
      .then(() => {
        return cloudwatchevents.putTargets({
          Rule: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME,
          Targets: [{
            Id: `lambda-${AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME}-starter`,
            Arn: `arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME}`
          }]
        }).promise();
      });
  });
}
