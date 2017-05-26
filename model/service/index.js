'use strict';

/**
 * @module Model
 */

const moment = require('moment');

/**
 * @class
 * */
class ExchangeRateRequest {
  /**
   * @constructor
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
   * @param {String} baseCurrency
   * @return {ExchangeRateRequest}
   * */
  static exchangeRateBaseOn (baseCurrency) {
    return new ExchangeRateRequest(baseCurrency);
  }
}

/**
 * @class
 * */
class ConversionRateRequest {
  /**
   * @param {String} baseCurrency
   * @return {ConversionRateRequest}
   * */
  static convertFrom (baseCurrency) {
    return new ConversionRateRequest(baseCurrency);
  }

  /**
   * @constructor
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

module.exports.ExchangeRateRequest = ExchangeRateRequest;
module.exports.ConversionRateRequest = ConversionRateRequest;

/**
 * @typedef ISO8601DateString
 * @type {String}
 * @description YYYY-MM-DDTHH:mm:ss.sssZ
 * @see {@link https://en.wikipedia.org/wiki/ISO_8601}
 * */
