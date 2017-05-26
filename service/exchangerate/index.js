'use strict';

/**
 * @module ExchangeRateService
 */
const config = require('../../config');

const db = require('../../model/db');
const functionHelper = require('../../helper/functional');
const AWSHelper = require('../../helper/aws');

const ExchangeRateRepository = require('../../repository/exchangerate');

const ConversionRate = db.ConversionRate;
const ArrayHelper = functionHelper.ArrayHelper;
const PromiseHelper = functionHelper.PromiseHelper;

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
    let insertJobs = ArrayHelper.arrayChunk(exchangeRates, config.aws.DYNAMO_DB_WRITE_BATCH_LIMIT).map((exchangeRate) => {
      let request = {};
      request[config.aws.DYNAMO_DB_TABLE_NAME] = exchangeRate.map(ExchangeRateRepository.exchangeRateToDynamoDBPutRequest);
      return AWSHelper.batchWriteItemWillRetryUnprocessedItems(request);
    });
    return PromiseHelper.seriesPromise(insertJobs);
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
      exchangeRateRequest.startDate, exchangeRateRequest.endDate, exchangeRateRequest.baseCurrency
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
    return ExchangeRateRepository.leastExchangeRate(exchangeRateRequest.baseCurrency);
  }
}

module.exports = ExchangeRateService;
