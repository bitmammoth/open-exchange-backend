'use strict';
/**
 * @module Helper
 */

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

const error = require('../../error/index');
const ValidationError = error.ValidationError;
const NotableError = error.NotableError;

/**
 * Handle express-validator callback while input cannot pass validation should raise error.
 * @function
 * @name validationResolvedCallback
 * @param {middlewareCallback} callback
 * @return {expressValidatorResolvedCallbackHandler}
 */
module.exports.validationResolvedCallback = (callback) => {
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
 * Handle express-validator callback while module internal error.
 * @function
 * @name validationRejectedCallback
 * @param {middlewareCallback} callback
 * @return {expressValidatorRejectedCallbackHandler}
 */
module.exports.validationRejectedCallback = (callback) => {
  return (error) => {
    callback(NotableError.fromNativeError(error));
  };
};
