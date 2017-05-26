'use strict';
/**
 * @module Middleware
 */

const logger = require('../../logger');
const errorModules = require('../../error');

/**
 * @class CustomResponseMiddleWare
 * */
class CustomResponseMiddleWare {
  /**
   * Will add jsonForSuccessResponse and jsonForFailureResponse function for response object
   * @static
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   * */
  static json (req, res, next) {
    res.jsonForSuccessResponse = CustomResponseMiddleWare.successResponse.bind(res);
    res.jsonForFailureResponse = CustomResponseMiddleWare.failureResponse.bind(res);
    next();
  }

  static defaultJSONResponse (isSuccessResponse) {
    return {
      success: isSuccessResponse,
      response_timestamp: new Date().getTime()
    };
  }

  static successResponse (body) {
    let responseJSON = CustomResponseMiddleWare.defaultJSONResponse(true);
    responseJSON.data = body;
    return this.json(responseJSON);
  }

  static failureResponse (error) {
    let responseJSON = CustomResponseMiddleWare.defaultJSONResponse(false);
    responseJSON.status = error.status;
    responseJSON.code = error.code;
    responseJSON.message = error.message;
    this.status(error.status || 500);
    if (CustomResponseMiddleWare.shouldErrorLogToLogger(error)) {
      logger.error({err: error});
    }
    return this.json(responseJSON);
  }

  /**
   * @static
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
