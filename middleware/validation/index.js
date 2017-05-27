'use strict';
/**
 * @module VerificationMiddleware
 */

const ValidationHelper = require('../../helper/validation').ValidationHelper;

/**
 * @class VerificationMiddleware
 * @memberOf module:VerificationMiddleware
 * */
class VerificationMiddleware {
  /**
   * @static
   * @function
   * @memberOf module:VerificationMiddleware
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   */
  static verifyHistoricalExchangeRateRequest (req, res, next) {
    req.checkQuery('pageToken', 'Next page token').optional().isBase64();
    req.checkParams('from', 'Missing base currency').notEmpty();
    req.checkQuery('startDate', 'Start date mismatch YYYY-MM-DD format').notEmpty().isISO8601();
    req.checkQuery('endDate', 'End date mismatch YYYY-MM-DD format').notEmpty().isISO8601();
    req.checkQuery('endDate', 'End date should after start date').isAfter(
      req.sanitizeQuery('startDate').trim()
    );
    req.getValidationResult()
      .then(ValidationHelper.validationResolvedCallback(next))
      .catch(ValidationHelper.validationRejectedCallback(next));
  };

  /**
   * @static
   * @function
   * @memberOf module:VerificationMiddleware
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   */
  static verifyLeastExchangeRateRequest (req, res, next) {
    req.checkQuery('pageToken', 'Next page token').optional().isBase64();
    req.checkParams('from', 'Missing base currency').notEmpty();
    req.getValidationResult()
      .then(ValidationHelper.validationResolvedCallback(next))
      .catch(ValidationHelper.validationRejectedCallback(next));
  };

  /**
   * @static
   * @function
   * @memberOf module:VerificationMiddleware
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   */
  static verifyHistoricalConversionRateRequest (req, res, next) {
    req.checkQuery('pageToken', 'Next page token').optional().isBase64();
    req.checkParams('from', 'Missing base currency').notEmpty();
    req.checkParams('to', 'Missing target currency').notEmpty();
    req.checkQuery('startDate', 'Start date mismatch YYYY-MM-DD format').notEmpty().isISO8601();
    req.checkQuery('endDate', 'End date mismatch YYYY-MM-DD format').notEmpty().isISO8601();
    req.checkQuery('endDate', 'End date should after start date').isAfter(
      req.query.startDate
    );
    req.checkQuery('amount', 'Missing amount in base currecny').notEmpty().isFloat();
    req.getValidationResult()
      .then(ValidationHelper.validationResolvedCallback(next))
      .catch(ValidationHelper.validationRejectedCallback(next));
  };

  /**
   * @static
   * @function
   * @memberOf module:VerificationMiddleware
   * @param {Object} req - HTTP request argument to the middleware function, called "req" by convention.
   * @param {Object} res - HTTP response argument to the middleware function, called "res" by convention.
   * @param {Object} next - Callback argument to the middleware function, called "next" by convention.
   */
  static verifyLeastConversionRequest (req, res, next) {
    req.checkQuery('pageToken', 'Next page token').optional().isBase64();
    req.checkParams('from', 'Missing base currency').notEmpty();
    req.checkParams('to', 'Missing target currency').notEmpty();
    req.checkQuery('amount', 'Missing amount in base currecny').notEmpty().isFloat();
    req.getValidationResult()
      .then(ValidationHelper.validationResolvedCallback(next))
      .catch(ValidationHelper.validationRejectedCallback(next));
  }
}

module.exports = VerificationMiddleware;
