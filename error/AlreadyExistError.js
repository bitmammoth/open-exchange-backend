'use strict';

const BaseError = require('./BaseError');

/** Use this error while resource already exist
 * @class
 * @memberOf module:Error
 * */
class AlreadyExistError extends BaseError {
  constructor (resourceName) {
    super(`${resourceName} already exist`);
    this.code = 101;
  }
};

module.exports = AlreadyExistError;