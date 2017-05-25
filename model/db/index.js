'use strict';

/**
 * @module Model
 */

/**
 * @typedef DynamoDBResponse
 * @type {Object}
 * @property {Array<DynamoDBItem>} Items
 * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#query-property} for full response structure
 * */
/**
 * @typedef DynamoDBItem
 * @type {Object}
 * @property {DynamoDBNumber} RateDate
 * @property {DynamoDBString} RateBase
 * @property {Object} Rates - An Object that using 3 little currency as key and value is {DynamoDBNumber}
 * */
/**
 * @typedef DynamoDBString
 * @type {Object}
 * @property {Object} S
 * */
/**
 * @typedef DynamoDBMap
 * @type {Object}
 * @property {Object} M
 * */
/**
 * @typedef DynamoDBNumber
 * @type {Object}
 * @property {Object} N
 * */

const moment = require('moment');

/**
 * @class
 * */
class ConversionRate {
  /**
   * @constructor
   * @param {ExchangeRateCollection} exchangeRateCollection
   * */
  constructor (exchangeRateCollection) {
    /**
     * @type ExchangeRateCollection
     * */
    this.exchangeRateCollection = exchangeRateCollection;
    this.minDate = this.exchangeRateCollection.minDate;
    this.maxDate = this.exchangeRateCollection.maxDate;
  }
  /* Will multiply all exchange rate with value.
   * @params {Number} value
   * @return {ConversionRate}
   * **/
  multiply (value) { // Will cause one more loop for array
    for (let date of this.exchangeRateCollection.allDate) {
      for (let currency of this.exchangeRateCollection.allCurrency) {
        this.exchangeRateCollection._serizeledExchangeRates[date][currency] = this.exchangeRateCollection._serizeledExchangeRates[date][currency] * value;
      }
    }
    return this;
  }

  /**
   * Extract single currency
   * @param {String} currency - Target Currency
   * @return {ConversionRate} ConversionRate
   * */
  filterCurrency (currency) {
    let rateCollection = new ExchangeRateCollection();
    rateCollection.registerCurrency(currency);
    for (let date of this.exchangeRateCollection.allDate) {
      rateCollection._serizeledExchangeRates[date] = {};
      let dateObj = moment(date, 'YYYYMMDD');
      let rate = this.exchangeRateCollection._serizeledExchangeRates[date][currency];
      if (rate) {
        rateCollection.push(dateObj.format('YYYYMMDD'), currency, rate);
        rateCollection.updateMinDate(dateObj);
        rateCollection.updateMaxDate(dateObj);
        rateCollection.registerDate(date);
      }
    }
    return new ConversionRate(rateCollection);
  }

  serialize () {
    let result = {};
    let currency = Array.from(this.exchangeRateCollection.allCurrency).pop();
    for (let date of this.exchangeRateCollection.allDate) {
      result[date] = this.exchangeRateCollection._serizeledExchangeRates[date][currency];
    }
    return result;
  }

  /**
   * @static
   * @param {ExchangeRateCollection} exchangeRateCollection
   * @param {String} targetCurrency
   * @return {ConversionRate}
   * */
  static convertExchangeRateToTargetCurrency (exchangeRateCollection, targetCurrency) {
    return new ConversionRate(exchangeRateCollection).filterCurrency(targetCurrency);
  }
}
/**
 * @class ExchangeRateCollection
 * */
class ExchangeRateCollection {
  /**
   * @static
   * @param {DynamoDBResponse} dynamoDBResponse - Record return from AWS SDK response.
   * @return {ExchangeRateCollection}
   * */
  static fromDynamoDB (dynamoDBResponse) { // TODO: function violate SRP. for transfer between model and third party structure should not place in model
    let rateCollection = new ExchangeRateCollection();
    let items = dynamoDBResponse.Items;
    for (let dailyExchangeRate of items) {
      let rates = dailyExchangeRate.Rates.M;
      let dateInt = dailyExchangeRate.RateDate.N;
      let rateBase = dailyExchangeRate.RateBase.S;
      let day = moment(dateInt, 'YYYYMMDD');
      rateCollection.baseCurrency = rateBase;
      rateCollection._serizeledExchangeRates[dateInt] = {};
      for (let currency in rates) {
        if (rates.hasOwnProperty(currency)) {
          let currencyRateOfBase = rates[currency].N;
          let rate = Number(currencyRateOfBase);
          rateCollection.updateMinDate(day);
          rateCollection.updateMaxDate(day);
          rateCollection.registerDate(dateInt);
          rateCollection.registerCurrency(currency);
          rateCollection.push(dateInt, currency, rate);
        }
      }
    }
    return rateCollection;
  }

  constructor () {
    /**
     * @type String
     * @default null
     * */
    this.baseCurrency = null;
    /**
     * @type Set
     * @default new Set()
     * */
    this.allDate = new Set();
    /**
     * @type Set
     * @default Set
     * */
    this.allCurrency = new Set();
    /**
     * @type Object
     * @default {}
     * */
    this._serizeledExchangeRates = {};
    /**
     * Minimum date of exchangeRates
     * @type Moment
     * @default Moment
     * */
    this.minDate = moment();

    /**
     * Maximum date of exchangeRates
     * @type Moment
     * @default Moment
     * */
    this.maxDate = moment();
  }

  /**
   * Will update minDate if date < minDate
   * @param {Moment} date
   * */
  updateMinDate (date) {
    if (date.isBefore(this.minDate)) {
      this.minDate = date;
    }
  }

  /**
   * Will update maxDate if date < minDate
   * @param {Moment} date
   * */
  updateMaxDate (date) {
    if (date.isAfter(this.maxDate)) {
      this.maxDate = date;
    }
  }

  /**
   * @param {Moment} date
   * */
  registerDate (date) {
    this.allDate.add(date);
  }

  /**
   * @param {String} currency
   * */
  registerCurrency (currency) {
    this.allCurrency.add(currency);
  }

  /**
   * @param {Number|String} dateInt - YYYYMMDD format date
   * @param {String} currency
   * @param {Number} exchangeRate
   * */
  push (dateInt, currency, exchangeRate) {
    this._serizeledExchangeRates[dateInt][currency] = exchangeRate;
  }

  /**
   * @return {Object}
   * */
  serialize () {
    return this._serizeledExchangeRates;
  }
}

module.exports.ExchangeRateCollection = ExchangeRateCollection;
module.exports.ConversionRate = ConversionRate;
