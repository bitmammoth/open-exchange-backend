'use strict';

const AWS = require('aws-sdk');
const config = require('../../config');
const error = require('../../error/');
const PromiseErrorHandler = require('./ErrorHandler');
const logger = require('../../logger');

const cloudwatchevents = new AWS.CloudWatchEvents();
const AlreadyExistError = error.AlreadyExistError;
const AWS_CONFIG = config.aws;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * */
class CloudWatchConstruct {
  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static construct () {
    return CloudWatchConstruct
      .shouldCreateCloudWatchScheduler()
      .then(CloudWatchConstruct.constructSchedulerOnCloudWatchEvent)
      .catch(PromiseErrorHandler.handleError);
  }

  /**
   * Create create event that will trigger on 4a.m HKT each day
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static constructSchedulerOnCloudWatchEvent () {
    logger.log('Will create niggtjob schedule on cloud watch');
    return cloudwatchevents.putRule({
      Name: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME,
      Description: 'Will trigger on HKT 4a.m',
      ScheduleExpression: 'cron(0 20 ? * * *)',
      State: 'ENABLED'
    }).promise();
  }

  /**
   * Will check CloudWatchEvent already config or not by role name
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static shouldCreateCloudWatchScheduler () {
    return new Promise((resolve, reject) => {
      return cloudwatchevents.listRules({
        NamePrefix: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME
      })
        .promise()
        .catch(resolve)
        .then((data) => {
          for (let rule of data.Rules) {
            if (rule.Name === AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME) {
              reject(new AlreadyExistError('CloudWatch'));
              return;
            }
          }
          resolve();
        });
    });
  }

  /**
   * Will execute lambda while scheduler trigger
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static addNightJobTarget () {
    return cloudwatchevents.putTargets({
      Rule: AWS_CONFIG.CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME,
      Targets: [{
        Id: `lambda-${AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME}-starter`,
        Arn: `arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${AWS_CONFIG.LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME}`
      }]
    }).promise();
  }
}

module.exports = CloudWatchConstruct;