'use strict';
const error = require('../../error');
const logger = require('../../logger');
const DBNoresultError = error.DBNoResultError;
const DateHelper = require('../../helper/date');

/**
 * @class
 * @memberOf module:DBModel
 * */
class ExchangeRate {
  /**
   * Factory function for create exchange rate that only one day.
   * @static
   * @function
   * @memberOf module:DBModel
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

    /**
     * Base64 encoded string for get next page data if result form dynamodb is paginated it will has token value
     * @type String
     * @default undefined
     * */
    this.nextPageToken = undefined;
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
    let targetCurrencyNotFound = !(currency in this._serizeledExchangeRates['currency']);
    if (targetCurrencyNotFound) {
      logger.error({rates: this._serizeledExchangeRates}, `${currency} not found!`);
      throw new DBNoresultError();
    }
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

module.exports = ExchangeRate;
