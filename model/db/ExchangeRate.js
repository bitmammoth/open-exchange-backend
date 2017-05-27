'use strict';
const error = require('../../error');
const logger = require('../../logger');
const DBNoresultError = error.DBNoResultError;
const DateHelper = require('../../helper/date');

/**
 * @class
 * @classdesc Class used for constuct ExchangeRateCollection
 * @memberOf module:DBModel
 * */
class ExchangeRateCollectionBuilder {
  constructor (baseCurrency) {
    this.baseCurrency = baseCurrency;
    this._minDate = DateHelper.dateToDateInt(new Date());
    this._maxDate = DateHelper.unixStartDateInt();
    this.allCurency = new Set();
    this.allDate = new Set();
    this.dateSet = [];
  }

  /**
   * @param {Number|String} dateInt - YYYYMMDD format date
   * @param {String} currency
   * @param {Number} exchangeRate
   * */
  addExchangeRateRecord (dateInt, currency, exchangeRate) {
    this.registerDate(dateInt);
    this.registerCurrency(currency);
    this.dateSet.push({date: Number(dateInt), currency: currency, rate: exchangeRate});
  }

  /**
   * @param {DateInt} dateInt
   * */
  registerDate (dateInt) {
    dateInt = Number(dateInt);
    this.minDate = dateInt;
    this.maxDate = dateInt;
    this.allDate.add(dateInt);
  }

  /**
   * @param {DateInt} minDateInt - value you want comparing current to min date
   * */
  set minDate (minDateInt) {
    if (minDateInt < this._minDate) {
      this._minDate = minDateInt;
    }
  }

  /**
   * @param {DateInt} maxDateInt - value you want comparing current to max date
   * */
  set maxDate (maxDateInt) {
    if (maxDateInt > this._maxDate) {
      this._maxDate = maxDateInt;
    }
  }

  registerCurrency (currency) {
    this.allCurency.add(currency);
  }

  /** Used for import open exchange rate. Data source is signal date based
   * @param {String} currency
   * @param {Number} exchangeRate
   * */
  addExchangeRateRecordForCurrency (currency, exchangeRate) {
    if (this.allDate.size === 1) {
      this.registerCurrency(currency);
      this.dateSet.push({date: this._minDate, currency: currency, rate: exchangeRate});
    }
  }

  build () {
    let result = new ExchangeRateCollection();
    result.baseCurrency = this.baseCurrency;
    result.allDate = Array.from(this.allDate).sort();
    result.allCurrency = Array.from(this.allCurency).sort();
    result.exchangeRate = this.dateSet;
    result.minDate = this._minDate;
    result.maxDate = this._maxDate;
    return result;
  }
}

/**
 * @class
 * @memberOf module:DBModel
 * */
class ExchangeRateCollection {
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
    this.exchangeRate = [];

    /**
     * Minimum date of exchangeRates
     * @type Number
     * @default 0
     * */
    this.minDate = 0;

    /**
     * Maximum date of exchangeRates
     * @type Number
     * @default 0
     * */
    this.maxDate = 0;

    /**
     * Base64 encoded string for get next page data if result form dynamodb is paginated it will has token value
     * @type String
     * @default undefined
     * */
    this.nextPageToken = undefined;
  }

  /***
   * @param {DateInt} date
   * @param {String} currency
   * @return {Number}
   */
  rateForDate (date, currency) {
    let rate = this.exchangeRate.filter((item) => {
      let matched = item.date === date && item.currency === currency;
      return matched;
    });
    if (rate.length === 0) {
      throw new DBNoresultError();
    } else {
      return rate[0].rate;
    }
  }

  /**
   * @param {String} currency
   * @return {ExchangeRate}
   * */
  filterByCurrency (currency) {
    let rateBuiler = new ExchangeRateCollectionBuilder();
    let targetCurrencyNotFound = this.allCurrency.indexOf(currency) < 0;
    if (targetCurrencyNotFound) {
      logger.error({rates: this._serizeledExchangeRates}, `${currency} not found!`);
      throw new DBNoresultError();
    }
    let targetRates = this.exchangeRate.filter((item) => item.currency === currency);
    for (let targetRate of targetRates) {
      rateBuiler.addExchangeRateRecord(targetRate.date, targetRate.currency, targetRate.rate);
    }
    let rate = rateBuiler.build();
    rate.nextPageToken = this.nextPageToken;
    return rate;
  }

  /**
   * Daily exchange rate of currencies
   * @return {Object}
   * */
  serialize () {
    let result = {};
    this.exchangeRate.forEach((exchangeRate) => {
      if (!result[exchangeRate.date]) {
        result[exchangeRate.date] = {};
      }
      result[exchangeRate.date][exchangeRate.currency] = exchangeRate.rate;
    }, this);
    return result;
  }

  /**
   * Daily exchange rate of currency
   * @param {String} currency
   * @return {Object}
   * */
  serializeByCurrency (currency) {
    let result = {};
    this.exchangeRate.forEach((exchangeRate) => {
      result[exchangeRate.date] = exchangeRate.rate;
    }, this);
    return result;
  }

  /**
   * Will multiply all exchange rate with value.
   * @function
   * @param {Number} value - Amount of price you want to multiply
   * @return {ExchangeRateCollection}
   * **/
  multiply (value) { // Will cause one more loop for array
    for (let data of this.exchangeRate) {
      data.rate = data.rate * value;
    }
    return this;
  }
}

module.exports = ExchangeRateCollectionBuilder;
