'use strict';

const AWS = require('aws-sdk');

const config = require('../../config');
const error = require('../../error');
const CloudWatchConstruct = require('./CloudWatch');
const PromiseErrorHandler = require('./ErrorHandler');
const PromiseHelper = require('../../helper/functional').PromiseHelper;
const logger = require('../../logger');

const lambda = new AWS.Lambda();
const AlreadyExistError = error.AlreadyExistError;
const AWS_CONFIG = config.aws;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * */
class LambdaConstruct {
  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static construct () {
    return PromiseHelper.seriesPromise([
      LambdaConstruct.constructExpressLambda(),
      LambdaConstruct.constructCronJobLambda()
    ]);
  }

  /** Will create express function if not e
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static constructExpressLambda () {
    return LambdaConstruct.shouldCreateLambda(AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME)
      .then(LambdaConstruct.createExpressLambda)
      .catch(PromiseErrorHandler.handleError);
  }

  /** Will create cron job function if not exist
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static constructCronJobLambda () {
    return LambdaConstruct.shouldCreateLambda(AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME)
      .then(LambdaConstruct.createCronJobLambda)
      .catch(PromiseErrorHandler.handleError);
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static createCronJobLambda () {
    logger.info('Will create function that will executed by fixed schedule');
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
      .then(LambdaConstruct.allowCronJobLambdaTriggerFromCloudWatch)
      .then(CloudWatchConstruct.addNightJobTarget);
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static allowCronJobLambdaTriggerFromCloudWatch () {
    return lambda.addPermission({
      Action: 'lambda:InvokeFunction',
      FunctionName: AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME,
      Principal: 'events.amazonaws.com',
      SourceArn: `arn:aws:events:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:rule/${AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME}`,
      StatementId: `cloud-watch-event-${AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME}`
    }).promise();
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static createExpressLambda () {
    logger.info('Will create function that will handle all API call');
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
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static shouldCreateLambda (lambdaFunctionName) {
    return lambda.getFunction({
      FunctionName: lambdaFunctionName
    }).promise()
      .then(() => Promise.reject(new AlreadyExistError(`Lambda: ${lambdaFunctionName}`)));
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static allowExpressLambdaTriggerFromAPITester (restApiId) {
    return lambda.addPermission({
      Action: 'lambda:InvokeFunction',
      FunctionName: AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME,
      Principal: 'apigateway.amazonaws.com',
      SourceArn: `arn:aws:execute-api:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:${restApiId}/*/*/*`,
      StatementId: `apt-gateway-${restApiId}-lambda-integration-test`
    }).promise();
  }
}

module.exports = LambdaConstruct;
