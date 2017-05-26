'use strict';

/**
 * @module ThirdPartyIntegration
 */
const rp = require('request-promise');

const config = require('../../config');
const ExchangeRateRepository = require('../../repository/exchangerate');
const logger = require('../../logger');

/**
 * @class
 * @memberOf module:ThirdPartyIntegration
 * */
class OpenExchangeRateService {
  /**
   * @function
   * @static
   * @param {Moment} importDate
   * @return {Promise<ExchangeRate>}
   * */
  static getHistoricalExchangeRate (importDate) {
    return rp.get({
      url: `https://openexchangerates.org/api/historical/${importDate.format('YYYY-MM-DD')}.json`,
      qs: {
        app_id: config.env.OPEN_EXCHANGE_RATE_APP_ID
      },
      json: true
    }).then((repos) => {
      logger.info('Request to openexchangerate finish.');
      let exchangeRateOfDifferenceBaseCurrency = ExchangeRateRepository.exchangeRateFromOpenExchangeAPIResponse(importDate, repos);
      return Promise.resolve(exchangeRateOfDifferenceBaseCurrency);
    });
  }
}

module.exports = OpenExchangeRateService;
