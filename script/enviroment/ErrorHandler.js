'use strict';

const logger = require('../../logger');

const error = require('../../error/');
const AlreadyExistError = error.AlreadyExistError;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * */
class PromiseErrorHandler {
  /**
   * Will trust err that type of AlreadyExistError can allowed
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static handleError (err) {
    if (err instanceof AlreadyExistError) {
      logger.info(err.message);
      return Promise.resolve();
    } else {
      return Promise.reject(err);
    }
  }
}

module.exports = PromiseErrorHandler;