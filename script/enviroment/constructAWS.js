#!/usr/bin/env node
'use strict';

/**
 * @module AWSInfrastructure
 */

process.env.NODE_ENV = 'development';

const logger = require('../../logger');
const error = require('../../error');

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
      process.exit(0);
    } else {
      logger.error({err: err}, 'Unexpected Error!');
      process.exit(-1);
    }
  });
}

function constructAWSEnvironment () {
  return IAM.construct()
    .then(CloudWatch.construct)
    .then(Lambda.construct)
    .then(DynamoDB.construct)
    .then(APIGateWay.construct);
}
