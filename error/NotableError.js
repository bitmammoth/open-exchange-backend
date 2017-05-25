'use strict';
/**
 * @module Error
 */

const BaseError = require('./BaseError');

/**
 * Sub class of that will appear in system log with error level
 * @class NotableError
 * */
module.exports = class NotableError extends BaseError {
  /**
   * Wrap native error to NotableError
   * @function fromNativeError
   * @static
   * @param {Error} error
   * @return {NotableError}
   * */
  static fromNativeError (error) {
    let notableError = new NotableError();
    notableError.message = error.message;
    return notableError;
  }
};
