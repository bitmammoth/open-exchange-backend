#!/usr/bin/env node
'use strict'
const AWS = require('aws-sdk');
const config = require('../../config');

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const cloudwatchevents = new AWS.CloudWatchEvents();

const DB_TABLE = 'ExchangeRates';
const EXPRESS_LAMBDA_FUNCTION = 'currencyExchangeBackend';
const API_NAME = 'Currency exchange backend';
const LAMBDA_SOURCE_CODE_PATH = 'lambda-codes/open-exchange-backend/openexchange-backend-2017052404-v0.0.2.zip';
const CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME = 'night_jobs';

Promise.resolve = Promise.resolve.bind(Promise);
Promise.reject = Promise.reject.bind(Promise);

if (require.main === module) {
  createAWSEnvironment().then(()=>{
    console.log('Success create AWS');
  }).catch((err)=>{
    if (err){
      console.log(err);
      return;
    }
    console.log('Environment already created');
  });
}

function createAWSEnvironment(){
  let initJobs = [];
  // initJobs.push(initDynamoDB());
  // initJobs.push(initExpressLambda());
  // initJobs.push(initAPIGateWay());
  initJobs.push(createSchedulerOnCloudWatchEvent());
  initJobs.push(initCronJobLambda());
  return seriesPromise(initJobs);
}

function initDynamoDB(){
  shouldCreateDynamoDBTable().then(()=>{
    return dynamodb.createTable({
      AttributeDefinitions:[
        {
          AttributeName: 'RateBase',
          AttributeType: 'S'
        },
        {
          AttributeName: 'RateDate',
          AttributeType: 'N'
        },
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
      TableName: DB_TABLE
    }).promise();
  }).catch(()=>{
    return Promise.resolve();//No error, Table already init
  });
}

function shouldCreateDynamoDBTable(){
  return dynamodb.describeTable({
    TableName: DB_TABLE
  }).promise().then(Promise.reject).catch(Promise.resolve);
}

function initExpressLambda(){
  return shouldCreateLambda(EXPRESS_LAMBDA_FUNCTION).then(()=>{
    return lambda.createFunction({
      Code: {
        S3Bucket: 'dng-dev-resources',
        S3Key: LAMBDA_SOURCE_CODE_PATH
      },
      FunctionName: EXPRESS_LAMBDA_FUNCTION,
      Handler: 'lambda.handler',
      Role: 'arn:aws:iam::139227058951:role/intranet',
      Runtime: 'nodejs6.10',
      Description: 'Currency exchange/convert API written in Express',
      MemorySize: 256,
      Publish: true,
      Timeout: 60,
    }).promise();
  }).catch(Promise.resolve);
}

function shouldCreateLambda(lambdaFunctionName){
  return lambda.getFunction({
    FunctionName: lambdaFunctionName
  }).promise()
    .then(Promise.reject)
    .catch(Promise.resolve);
}

function initAPIGateWay(){
  //TODO: Refactor this function. It too long and painful to read
  //http://docs.aws.amazon.com/lambda/latest/dg/with-on-demand-https-example-configure-event-source.html
  return shouldSetupApiGateway().then(()=>{
    return apigateway.createRestApi({
      name: API_NAME,
      description: 'API for list least/historical exchange rate'
    }).promise()
      .then((data)=>{
        return rootResourceSourceIDOfAPI(data.id);
      })
      .then((data)=>{
        //Set up proxy api for lambda, any request will use that endpoint to communicate to lambda
        return apigateway.createResource({
          restApiId: data.restApiId,
          pathPart: '{proxy+}',
          parentId: data.resourceId
        }).promise().then((resourceData)=>{
          return Promise.resolve({
            resourceId: resourceData.id,
            restApiId: data.restApiId
          });
        })
      })
      .then((data)=>{
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          apiKeyRequired: false,
          requestParameters: {
            'method.request.path.proxy' : true
          }
        }).promise().then(()=>{return Promise.resolve(data);});
      })
      .then((data)=>{
        //http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html
        return apigateway.putIntegration({
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST', //API Gateway uses to communicate with AWS Lambda
          passthroughBehavior: 'WHEN_NO_MATCH',
          uri: `arn:aws:apigateway:${config.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${EXPRESS_LAMBDA_FUNCTION}/invocations`
        }).promise().then(()=>{return Promise.resolve(data)});
      })
      .then((data)=>{
        return apigateway.putIntegrationResponse({
          httpMethod: 'ANY',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          contentHandling: 'CONVERT_TO_TEXT',
          responseTemplates:{
            'application/json': null
          }
        }).promise().then(()=>{return Promise.resolve(data)});
      })
      .then((data)=>{
        //http://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
        //Set up preflight method for wbe site AJAX request
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          apiKeyRequired: false,
        }).promise().then(()=>{return Promise.resolve(data);});
      })
      .then((data)=>{
        return apigateway.putIntegration({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          type: 'MOCK',
          integrationHttpMethod: 'POST', //API Gateway uses to communicate with AWS Lambda
          requestTemplates: {
            'application/json': null
          },
          passthroughBehavior: 'WHEN_NO_MATCH'
        }).promise().then(()=>{return Promise.resolve(data)});
      })
      .then((data)=>{
        return apigateway.putMethodResponse({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          responseParameters:{
            'method.response.header.Access-Control-Allow-Headers' : true,
            'method.response.header.Access-Control-Allow-Methods' : true,
            'method.response.header.Access-Control-Allow-Origin' : true
          },
          responseModels:{
            'application/json': 'Empty'
          }
        }).promise().then(()=>{return Promise.resolve(data)});
      })
      .then((data)=>{
        return apigateway.putIntegrationResponse({
          httpMethod: 'OPTIONS',
          resourceId: data.resourceId,
          restApiId: data.restApiId,
          statusCode: '200',
          responseParameters:{
            'method.response.header.Access-Control-Allow-Headers' : "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
            'method.response.header.Access-Control-Allow-Methods' : "'*'",
            'method.response.header.Access-Control-Allow-Origin' : "'*'"
          },
          responseTemplates:{
            'application/json': null
          }
        }).promise().then(()=>{return Promise.resolve(data)});
      })
      .then((data)=>{
        //Enable APIGateway tester by allow tester invoke lambda
        return lambda.addPermission({
          Action: 'lambda:InvokeFunction',
          FunctionName: EXPRESS_LAMBDA_FUNCTION,
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:${data.restApiId}/*/*/*`,
          StatementId: `apt-gateway-${data.restApiId}-lambda-integration-test`
        }).promise().then(()=>{return Promise.resolve(data)})
      })
      .then((data)=>{
        //Deploy apigateway to stage test.
        return apigateway.createDeployment({
          restApiId: data.restApiId,
          description: 'Initialize deployment',
          stageName: 'test',
          stageDescription: 'Testing environment'
        }).promise().then(()=>{
          console.log(`API deployed to https://${data.restApiId}.execute-api.ap-northeast-1.amazonaws.com/test`);
          return Promise.resolve(data);
        });
      });
  }).catch(Promise.resolve);
}

function shouldSetupApiGateway(){
  return new Promise((resolve,reject)=>{
    return apigateway.getRestApis({
      limit: 500
    }).promise().then((data)=>{
      for (let item of data.items){
        if (item.name === API_NAME){
          reject();
          return;
        }
      }
      resolve();
    });
  });
}

function rootResourceSourceIDOfAPI(restApiId){
  return apigateway.getResources({
    restApiId:restApiId
  }).promise().then((data)=>{
    let resource = data.items[0]
    return Promise.resolve({
      resourceId: resource.id,
      restApiId: restApiId
    })
  });
}

function seriesPromise(promiseJobs){
  return new Promise((resolve,reject)=>{
    let promiseWillSeriesExecute = Promise.resolve();
    promiseJobs.forEach(function(promiseJob){
      promiseWillSeriesExecute = promiseWillSeriesExecute
        .then(()=>{return promiseJob;})
        .catch((err)=>{
          console.log(err);
          reject(err);
        });
    });
    promiseWillSeriesExecute.then(resolve);
  })
}

function createSchedulerOnCloudWatchEvent(){
  return shouldCreateCloudWatchScheduler()
    .then(()=>{
      cloudwatchevents.putRule({
        Name: CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME,
        Description: 'Will trigger on HKT 4a.m',
        ScheduleExpression: 'cron(0 20 ? * * *)',
        State: 'ENABLED'
      }).promise()
    })
    .catch(Promise.resolve);
}

function shouldCreateCloudWatchScheduler(){
  return new Promise((resolve,reject)=>{
    cloudwatchevents.listRules({
      NamePrefix: CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME
    })
    .promise()
      .catch(resolve)
      .then((data)=>{
        for (let rule of data.Rules){
          if (rule.Name === CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME){
            reject();
            return;
          }
        }
        resolve();
      })
  });
}

function initCronJobLambda(){
  const downloadExchangeRateCronJobName = 'downloadOpenExchangeRate' ;
  return shouldCreateLambda(downloadExchangeRateCronJobName).then(()=>{
    return lambda.createFunction({
      Code: {
        S3Bucket: 'dng-dev-resources',
        S3Key: LAMBDA_SOURCE_CODE_PATH
      },
      FunctionName: downloadExchangeRateCronJobName,
      Handler: 'lambdaCron.handler',
      Role: 'arn:aws:iam::139227058951:role/intranet',
      Runtime: 'nodejs6.10',
      Description: 'Will download exchange rate to dynamo DB',
      MemorySize: 512,
      Publish: true,
      Timeout: 300,
      Environment:{
        Variables:{
          TZ:process.env.TZ //Default
        }
      }
    }).promise()
      .then(()=>{
        return lambda.addPermission({
          Action: 'lambda:InvokeFunction',
          FunctionName: downloadExchangeRateCronJobName,
          Principal: 'events.amazonaws.com',
          SourceArn: `arn:aws:events:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:rule/${CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME}`,
          StatementId: `cloud-watch-event-${CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME}`
        }).promise()
      })
      .then(()=>{
        return cloudwatchevents.putTargets({
          Rule: CLOUDWATCH_NIGHT_JOB_SCHEDULER_NAME,
          Targets:[{
            Id: `lambda-${downloadExchangeRateCronJobName}-starter`,
            Arn: `arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${downloadExchangeRateCronJobName}`
          }]
        }).promise()
      });
  }).catch(Promise.resolve);
}


