'use strict';

const BaseError = require('./BaseError');

/**
 * Sub class of that will appear in system log with error level
 * @class NotableError
 * @memberOf module:Error
 * */
class NotableError extends BaseError {
  /**
   * Wrap native error to NotableError
   * @static
   * @memberOf module:Error
   * @param {Error} error
   * @return {NotableError}
   * */
  static fromNativeError (error) {
    let notableError = new NotableError();
    notableError.message = error.message;
    return notableError;
  }
}

module.exports = NotableError;
