'use strict';
/**
 * @module ValidateHelper
 */
const error = require('../../error/index');
const ValidationError = error.ValidationError;
const NotableError = error.NotableError;

/**
 * @class
 * @memberOf module:ValidateHelper
 */
class ValidationHelper {
  /**
   * Handle express-validator callback while input cannot pass validation should raise error.
   * @static
   * @function
   * @memberOf module:ValidateHelper
   * @param {middlewareCallback} callback
   * @return {expressValidatorResolvedCallbackHandler}
   */
  static validationResolvedCallback (callback) {
    return (result) => {
      let requestInValidate = !result.isEmpty();
      if (requestInValidate) {
        callback(
          new ValidationError(result.array())
        );
        return;
      }
      callback();
    };
  };
  /**
   * Handle express-validator callback while input cannot pass validation should raise error.
   * @static
   * @function
   * @memberOf module:ValidateHelper
   * @param {middlewareCallback} callback
   * @return {expressValidatorResolvedCallbackHandler}
   */
  static validationRejectedCallback (callback) {
    return (error) => {
      callback(NotableError.fromNativeError(error));
    };
  };
}

module.exports.ValidationHelper = ValidationHelper;

/**
 * Callback signature same as express middleware 'next' params
 * @see {@link http://expressjs.com/en/guide/writing-middleware.html}
 *
 * @callback middlewareCallback
 * @param {Error} [error] - Null if anything is fine.
 */

/**
 * Callback for handle express-validator promise resolved
 * @see {@link https://github.com/ctavan/express-validator}
 *
 * @callback expressValidatorResolvedCallbackHandler
 * @param {Object} result - Result of validation
 * */

/**
 * Callback for handle express-validator promise rejected
 * @see {@link https://github.com/ctavan/express-validator}
 *
 * @callback expressValidatorRejectedCallbackHandler
 * @param {Error} result - Result of validation
 * */
