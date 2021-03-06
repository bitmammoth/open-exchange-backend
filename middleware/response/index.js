'use strict';
/**
 * @module ResponseMiddleware
 */

const logger = require('../../logger');
const errorModules = require('../../error');

/**
 * @class CustomResponseMiddleWare
 * @memberOf module:ResponseMiddleware
 * */
class CustomResponseMiddleWare {
  /**
   * Will add jsonForSuccessResponse and jsonForFailureResponse function for response object
   * @static
   * @function
   * @memberOf module:ResponseMiddleware
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   * */
  static json (req, res, next) {
    res.jsonForSuccessResponse = CustomResponseMiddleWare.successResponse(req, res);
    res.jsonForFailureResponse = CustomResponseMiddleWare.failureResponse(req, res);
    next();
  }

  static defaultJSONResponse (isSuccessResponse) {
    return {
      success: isSuccessResponse,
      response_timestamp: new Date().getTime()
    };
  }

  static successResponse (req, res) {
    return (body) => {
      let responseJSON = CustomResponseMiddleWare.defaultJSONResponse(true);
      responseJSON.data = body;
      return res.json(responseJSON);
    };
  }

  static failureResponse (req, res) {
    return (error) => {
      let responseJSON = CustomResponseMiddleWare.defaultJSONResponse(false);
      responseJSON.status = error.status;
      responseJSON.code = error.code;
      responseJSON.message = error.message;
      res.status(error.status || 500);
      if (CustomResponseMiddleWare.shouldErrorLogToLogger(error)) {
        logger.error({req: req, err: error});
      }
      return res.json(responseJSON);
    };
  }

  /**
   * @static
   * @function
   * @memberOf module:ResponseMiddleware
   * @param {Error} error
   * @return {boolean}
   **/
  static shouldErrorLogToLogger (error) {
    let willErrorWriteToLogger = false;
    let isNotableError = error instanceof errorModules.NotableError;
    let isNativeError = !(error instanceof errorModules.BaseError);
    if (isNotableError || isNativeError) {
      willErrorWriteToLogger = true;
    }
    return willErrorWriteToLogger;
  }
}

module.exports = CustomResponseMiddleWare;
