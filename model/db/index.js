'use strict';

/**
 * @module Model
 */

const DateHelper = require('../../helper/date');

/**
 * @class
 * */
class ConversionRate {
  /**
   * @constructor
   * @param {ExchangeRate} exchangeRateCollection
   * */
  constructor (exchangeRateCollection) {
    /**
     * @type ExchangeRate
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
        this.exchangeRateCollection.push(date, currency, this.exchangeRateCollection.rateForDate(date, currency) * value);
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
    this.exchangeRateCollection = this.exchangeRateCollection.filterByCurrency(currency);
    return this;
  }

  serialize () {
    let currency = Array.from(this.exchangeRateCollection.allCurrency).pop();
    return this.exchangeRateCollection.serializeByCurrency(
      currency
    );
  }

  /**
   * @static
   * @param {ExchangeRate} exchangeRateCollection
   * @param {String} targetCurrency
   * @return {ConversionRate}
   * */
  static convertExchangeRateToTargetCurrency (exchangeRateCollection, targetCurrency) {
    return new ConversionRate(exchangeRateCollection).filterCurrency(targetCurrency);
  }
}
/**
 * @class
 * */
class ExchangeRate {
  /**
   * Factory function for create exchagne rate that only one day.
   * @static
   * @param {String} baseCurrency - BaseCurrency
   * @param {Moment} date - Date of that record
   * @return {ExchangeRate}
   * */
  static exchangeRateOfDay (baseCurrency, date) {
    let exchangeRate = new ExchangeRate();
    exchangeRate.baseCurrency = baseCurrency;
    exchangeRate.updateMinDate(date);
    exchangeRate.updateMaxDate(date);
    exchangeRate.registerDate(DateHelper.dateToDateInt(date));
    return exchangeRate;
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
     * Underlined data structure used to store exchange rate by date
     * @type Object
     * @default {}
     * */
    this._serizeledExchangeRates = {};
    this._serizeledExchangeRates['date'] = {};
    this._serizeledExchangeRates['currency'] = {};

    /**
     * Minimum date of exchangeRates
     * @type Moment
     * @default Moment
     * */
    this.minDate = DateHelper.now();

    /**
     * Maximum date of exchangeRates
     * @type Moment
     * @default Moment
     * */
    this.maxDate = DateHelper.now();
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

  /***
   * @param {DateInt} date
   * @param {String} currency
   * @return {Number}
   */
  rateForDate (date, currency) {
    return this._serizeledExchangeRates['date'][date][currency];
  }

  /**
   * @param {Number|String} dateInt - YYYYMMDD format date
   * @param {String} currency
   * @param {Number} exchangeRate
   * */
  push (dateInt, currency, exchangeRate) {
    if (!this._serizeledExchangeRates['date'][dateInt]) {
      this._serizeledExchangeRates['date'][dateInt] = {};
    }
    if (!this._serizeledExchangeRates['currency'][currency]) {
      this._serizeledExchangeRates['currency'][currency] = {};
    }
    this._serizeledExchangeRates['date'][dateInt][currency] = exchangeRate;
    this._serizeledExchangeRates['currency'][currency][dateInt] = exchangeRate;
  }

  /**
   * @param {String} currency
   * @return {ExchangeRate}
   * */
  filterByCurrency (currency) {
    let rateAfterFilter = new ExchangeRate();
    let targetRates = this._serizeledExchangeRates['currency'][currency];
    let allDates = Object.keys(targetRates).map(Number);
    rateAfterFilter.allDate = new Set(allDates.map(String));
    rateAfterFilter.allCurrency = new Set([currency]);
    rateAfterFilter.minDate = DateHelper.dateIntToDate(Math.min(allDates));
    rateAfterFilter.maxDate = DateHelper.dateIntToDate(Math.max(allDates));
    for (let date of allDates) {
      rateAfterFilter.push(date, currency, targetRates[date]);
    }
    return rateAfterFilter;
  }

  /**
   * Daily exchange rate of currencies
   * @return {Object}
   * */
  serialize () {
    return this._serizeledExchangeRates['date'];
  }

  /**
   * Daily exchange rate of currency
   * @param {String} currency
   * @return {Object}
   * */
  serializeByCurrency (currency) {
    return this._serizeledExchangeRates['currency'][currency];
  }
}

module.exports.ExchangeRate = ExchangeRate;
module.exports.ConversionRate = ConversionRate;
