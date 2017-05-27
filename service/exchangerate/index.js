'use strict';

/**
 * @module ExchangeRateService
 */
const db = require('../../model/db');

const ExchangeRateRepository = require('../../repository/exchangerate');

const ConversionRate = db.ConversionRate;

/**
 * @class ExchangeRateService
 * @memberOf module:ExchangeRateService
 * */
class ExchangeRateService {
  /**
   *  @function
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateService
   *  @param {Array<ExchangeRate>} exchangeRates
   *  @return {Promise<ConversionRate>}
   * */
  static importExchangeRate (exchangeRates) {
    return ExchangeRateRepository.importExchangeRate(exchangeRates);
  }
  /**
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateService
   *  @param {ConversionRateRequest} conversionRateRequest
   *  @return {Promise<ConversionRate>}
   * */
  static queryLeastConversionRateBaseOnCurrency (conversionRateRequest) {
    return ExchangeRateService.queryLeastExchangeRateBaseOnCurrency(conversionRateRequest.asExchangeRateRequest())
      .then((rate) => {
        let conversionRate = ConversionRate.convertExchangeRateToTargetCurrency(rate, conversionRateRequest.targetCurrency)
          .multiply(conversionRateRequest.amount);
        return Promise.resolve(conversionRate);
      });
  }

  /**
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateService
   *  @param {ConversionRateRequest} conversionRateRequest
   *  @return {Promise<ConversionRate>}
   * */
  static queryConversionRateBaseOnCurrency (conversionRateRequest) {
    return ExchangeRateService.queryExchangeRateBaseOnCurrency(conversionRateRequest.asExchangeRateRequest())
      .then((rate) => {
        let conversionRate = ConversionRate.convertExchangeRateToTargetCurrency(rate, conversionRateRequest.targetCurrency)
          .multiply(conversionRateRequest.amount);
        return Promise.resolve(conversionRate);
      });
  }

  /**
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateService
   *  @param {ExchangeRateRequest} exchangeRateRequest
   *  @return {Promise<ExchangeRate>}
   * */
  static queryExchangeRateBaseOnCurrency (exchangeRateRequest) {
    return ExchangeRateRepository.historicalExchangeRate(
      exchangeRateRequest.startDate, exchangeRateRequest.endDate,
      exchangeRateRequest.baseCurrency, exchangeRateRequest.pageToken
    );
  }

  /**
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateService
   *  @param {ExchangeRateRequest} exchangeRateRequest
   *  @return {Promise<ExchangeRate>}
   * */
  static queryLeastExchangeRateBaseOnCurrency (exchangeRateRequest) {
    return ExchangeRateRepository.leastExchangeRate(
      exchangeRateRequest.baseCurrency,
      exchangeRateRequest.pageToken
    );
  }
}

module.exports = ExchangeRateService;
