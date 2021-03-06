'use strict';

const moment = require('moment');

const ExchangeRateRequest = require('./ExchangeRateRequest');
const DynamoDBHelper = require('../../helper/aws').DynamoDBHelper;

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
    /**
     * @type String
     * */
    this.pageToken = null;
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
   * @param {String} pageToken - base64 encoding token
   * @return {ConversionRateRequest}
   * */
  withPageToken (pageToken) {
    this.pageToken = pageToken;
    return this;
  }

  /**
   * @return {ExchangeRateRequest}
   * */
  asExchangeRateRequest () {
    return ExchangeRateRequest.exchangeRateBaseOn(this.baseCurrency)
      .startFrom(this.startDate)
      .endOf(this.endDate)
      .withPageToken(this.pageToken);
  }
}

module.exports = ConversionRateRequest;
