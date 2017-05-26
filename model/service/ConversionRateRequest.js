'use strict';

const ExchangeRateRequest = require('./ExchangeRateRequest');

/**
 * @class
 * @memberOf module:ServiceModel
 * */
class ConversionRateRequest {
  /**
   * @static
   * @function
   * @memberOf module:ServiceModel
   * @param {String} baseCurrency
   * @return {ConversionRateRequest}
   * */
  static convertFrom (baseCurrency) {
    return new ConversionRateRequest(baseCurrency);
  }

  /**
   * @constructor
   * @memberOf module:ServiceModel
   * @param {String} baseCurrency
   * */
  constructor (baseCurrency) {
    /**
     * @type String
     * */
    this.from(baseCurrency);
    /**
     * @type String
     * */
    this.targetCurrency = null;
    /**
     * @type Moment
     * */
    this.startDate = null;
    /**
     * @type Moment
     * */
    this.endDate = null;
    /**
     * @type Number
     * */
    this.amount = 1;
  }

  /**
   * @param {String} currency
   * @return {ConversionRateRequest}
   * */
  from (currency) {
    this.baseCurrency = currency;
    return this;
  }

  /**
   * @param {String} targetCurrency
   * @return {ConversionRateRequest}
   * */
  target (targetCurrency) {
    this.targetCurrency = targetCurrency;
    return this;
  }

  /**
   * @param {ISO8601DateString} startDate
   * @return {ConversionRateRequest}
   * */
  startFrom (startDate) {
    this.startDate = moment(startDate);
    return this;
  }

  /**
   * @param {ISO8601DateString} endDate
   * @return {ConversionRateRequest}
   * */
  endOf (endDate) {
    this.endDate = moment(endDate);
    return this;
  }

  /**
   * @param {Number} amount
   * @return {ConversionRateRequest}
   * */
  withAmount (amount) {
    this.amount = amount;
    return this;
  }

  /**
   * @return {ExchangeRateRequest}
   * */
  asExchangeRateRequest () {
    return ExchangeRateRequest.exchangeRateBaseOn(this.baseCurrency)
      .startFrom(this.startDate)
      .endOf(this.endDate);
  }
}

module.exports = ConversionRateRequest;
