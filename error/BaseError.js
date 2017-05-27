'use strict';
/**
 * Base class for acknowledge system error
 * @class BaseError
 * @memberOf module:Error
 * */
module.exports = class BaseError extends Error {
  constructor (message) {
    super(message);
    this.code = 0;
    this.status = 500;
  }
};
