#!/usr/bin/env node
'use strict';

/**
 * @module AWSInfrastructure
 */

process.env.NODE_ENV = 'development';

const logger = require('../../logger');
const error = require('../../error');
const PromiseHelper = require('../../helper/functional').PromiseHelper;
const IAM = require('./IAM');
const CloudWatch = require('./CloudWatch');
const Lambda = require('./Lambda');
const DynamoDB = require('./DynamoDB');
const APIGateWay = require('./APIGateway');

const AlreadyExistError = error.AlreadyExistError;

if (require.main === module) {
  constructAWSEnvironment().then(() => {
    logger.info('Success construct AWS');
  }).catch((err) => {
    if (err instanceof AlreadyExistError) {
      logger.info('Environment already constructed');
      logger.info({err: err}, 'Resource already exist Error!');
      process.exit(0);
    } else {
      logger.error({err: err}, 'Unexpected Error!');
      process.exit(-1);
    }
  });
}

function constructAWSEnvironment () {
  let constructAWSJobs = [];
  constructAWSJobs.push(IAM.construct());
  constructAWSJobs.push(CloudWatch.construct());
  constructAWSJobs.push(Lambda.construct());
  constructAWSJobs.push(DynamoDB.construct());
  constructAWSJobs.push(APIGateWay.construct());
  return PromiseHelper.seriesPromise(constructAWSJobs);
}