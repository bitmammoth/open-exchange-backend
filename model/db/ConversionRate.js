'use strict';

/**
 * @class
 * @memberOf module:DBModel
 * */
class ConversionRate {
  /**
   * @static
   * @function
   * @memberOf module:DBModel
   * @param {ExchangeRate} exchangeRateCollection
   * @param {String} targetCurrency
   * @return {ConversionRate}
   * */
  static convertExchangeRateToTargetCurrency (exchangeRateCollection, targetCurrency) {
    return new ConversionRate(exchangeRateCollection).filterCurrency(targetCurrency);
  }
  /**
   * @constructor
   * @memberOf module:DBModel
   * @param {ExchangeRate} exchangeRateCollection
   * */
  constructor (exchangeRateCollection) {
    /**
     * @type ExchangeRate
     * */
    this.exchangeRateCollection = exchangeRateCollection;
    this.minDate = this.exchangeRateCollection.minDate;
    this.maxDate = this.exchangeRateCollection.maxDate;
    this.nextPageToken = this.exchangeRateCollection.nextPageToken;
  }
  /**
   * Will multiply all exchange rate with value.
   * @function
   * @param {Number} value - Amount of price you want to multiply
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
}

module.exports = ConversionRate;
