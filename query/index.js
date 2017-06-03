'use strict';

/**
 * @module GraphQLQuery
 */

const DateHelper = require('../helper/date');
const serviceModel = require('../model/service');
const ExchangeRateService = require('../service/exchangerate');

const ExchangeRateRequest = serviceModel.ExchangeRateRequest;
const ConversionRateRequest = serviceModel.ConversionRateRequest;

function historicalExchangeRate (args) {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(args.baseCurrency)
    .startFrom(args.dateRange.startDate)
    .endOf(args.dateRange.endDate)
    .withPageToken(args.pageToken);
  return ExchangeRateService.queryExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    return Promise.resolve({
      base: exchangeRateRequest.baseCurrency,
      from: DateHelper.dateToDateInt(exchangeRateRequest.startDate),
      to: DateHelper.dateToDateInt(exchangeRateRequest.endDate),
      rates: rateCollection.exchangeRate,
      next_page_token: rateCollection.nextPageToken
    });
  });
}

function leastExchangeRate (args) {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(args.baseCurrency)
      .withPageToken(args.pageToken);
  return ExchangeRateService.queryLeastExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    return Promise.resolve({
      base: exchangeRateRequest.baseCurrency,
      from: String(rateCollection.minDate),
      to: String(rateCollection.maxDate),
      rates: rateCollection.exchangeRate,
      next_page_token: rateCollection.nextPageToken
    });
  });
}

function historicalConversionRate (args) {
  let conversionRequest = ConversionRateRequest.convertFrom(args.currencyConvert.from)
    .target(args.currencyConvert.to)
    .startFrom(args.dateRange.startDate)
    .endOf(args.dateRange.endDate)
    .withAmount(args.currencyConvert.amount)
    .withPageToken(args.pageToken);
  return ExchangeRateService.queryConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    return Promise.resolve({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: DateHelper.dateToDateInt(conversionRequest.startDate),
      to: DateHelper.dateToDateInt(conversionRequest.endDate),
      rates: conversionRate.exchangeRate,
      next_page_token: conversionRate.nextPageToken
    });
  });
}

function leastConversionRate (args) {
  let conversionRequest = ConversionRateRequest.convertFrom(args.currencyConvert.from)
    .target(args.currencyConvert.to)
    .withAmount(args.currencyConvert.amount)
    .withPageToken(args.pageToken);
  return ExchangeRateService.queryLeastConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    return Promise.resolve({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: String(conversionRate.minDate),
      to: String(conversionRate.maxDate),
      rates: conversionRate.exchangeRate,
      next_page_token: conversionRate.nextPageToken
    });
  });
}

module.exports = {
  historicalExchangeRate: historicalExchangeRate,
  leastExchangeRate: leastExchangeRate,
  historicalConversionRate: historicalConversionRate,
  leastConversionRate: leastConversionRate
};
