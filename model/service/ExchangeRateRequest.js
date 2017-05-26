'use strict';

const moment = require('moment');

/**
 * @class
 * @memberOf module:ServiceModel
 * */
class ExchangeRateRequest {
  /**
   * @constructor
   * @memberOf module:ServiceModel
   * @param {String} baseCurrency
   * */
  constructor (baseCurrency) {
    /**
     * @type String
     * */
    this.baseCurrency = baseCurrency;
    /**
     * @type Moment
     * */
    this.startDate = null;
    /**
     * @type Moment
     * */
    this.endDate = null;
  }

  /**
   * @param {ISO8601DateString} startDate
   * @return {ExchangeRateRequest}
   * */
  startFrom (startDate) {
    this.startDate = moment(startDate);
    return this;
  }

  /**
   * @param {ISO8601DateString} endDate
   * @return {ExchangeRateRequest}
   * */
  endOf (endDate) {
    this.endDate = moment(endDate);
    return this;
  }

  /**
   * @static
   * @function
   * @memberOf module:ServiceModel
   * @param {String} baseCurrency
   * @return {ExchangeRateRequest}
   * */
  static exchangeRateBaseOn (baseCurrency) {
    return new ExchangeRateRequest(baseCurrency);
  }
}

module.exports = ExchangeRateRequest;