'use strict';

/*
 * @namespace service
 * @module service
 * @memberOf service
 */

const exchangeQueryService = require('./exchangerate/index');

module.exports.queryExchangeRateBaseOnCurrency = exchangeQueryService.queryExchangeRateBaseOnCurrency;
module.exports.queryLeastExchangeRateBaseOnCurrency = exchangeQueryService.queryLeastExchangeRateBaseOnCurrency;