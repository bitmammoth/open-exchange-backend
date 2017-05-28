'use strict';

const AWS = require('aws-sdk');

const config = require('../../config');
const error = require('../../error/');
const PromiseErrorHandler = require('./ErrorHandler');
const logger = require('../../logger');

const AlreadyExistError = error.AlreadyExistError;

const iam = new AWS.IAM();
const AWS_CONFIG = config.aws;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * */
class IAMConstructor {
  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static construct () {
    return IAMConstructor
      .shouldCreateIAMRoleForServiceExecute()
      .then(IAMConstructor.createRoleForServiceExecute)
      .catch(PromiseErrorHandler.handleError);
  }

  /**
   * Will create IAM role with Admin Right. You can modify them if Admin role has concern
   * Will sleep for 10s prevent role don't appear while create lambda
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * @see {@link: https://stackoverflow.com/questions/36419442/the-role-defined-for-the-function-cannot-be-assumed-by-lambda}
   * */
  static createRoleForServiceExecute () {
    logger.info('Will create role that have super user access right! You cna modify them in AWS console after role created.');
    return new Promise((resolve, reject) => {
      iam.createRole({
        AssumeRolePolicyDocument: AWS_CONFIG.IAM_ROLE_TRUST_RELATIONSHIP,
        RoleName: AWS_CONFIG.IAM_ROLE_NAME
      }).promise()
        .then(() => {
          return iam.attachRolePolicy({
            PolicyArn: AWS_CONFIG.IAM_ROLE_POLICY,
            RoleName: AWS_CONFIG.IAM_ROLE_NAME
          }).promise().then((data) => {
            logger.info('Will wait for 10s after complete create iam roles');
            setTimeout(() => resolve(data), 10000);
          });
        }).catch((reject));
    });
  }

  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static shouldCreateIAMRoleForServiceExecute () {
    return new Promise((resolve, reject) => {
      iam.listRoles({
        PathPrefix: '/'
      }).promise().then((data) => {
        for (let role of data.Roles) {
          if (role.Arn === AWS_CONFIG.IAM_ROLE_ARN) {
            reject(new AlreadyExistError('IAM'));
            return;
          }
        }
        resolve();
      });
    });
  }
}

module.exports = IAMConstructor;
