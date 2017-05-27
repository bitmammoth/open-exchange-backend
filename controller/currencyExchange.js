
'use strict';
const express = require('express');
const router = express.Router();

const VerificationMiddleware = require('../middleware/validation');
const serviceModel = require('../model/service');
const ExchangeRateService = require('../service/exchangerate');

const ExchangeRateRequest = serviceModel.ExchangeRateRequest;
const ConversionRateRequest = serviceModel.ConversionRateRequest;

router.get('/exchange/historical/:from', VerificationMiddleware.verifyHistoricalExchangeRateRequest, (req, res) => {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(req.params.from)
    .startFrom(req.query.startDate)
    .endOf(req.query.endDate);
  ExchangeRateService.queryExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    res.jsonForSuccessResponse({
      base: exchangeRateRequest.baseCurrency,
      from: exchangeRateRequest.startDate.format('YYYYMMDD'),
      to: exchangeRateRequest.endDate.format('YYYYMMDD'),
      rates: rateCollection.serialize(),
      nextPageToken: rateCollection.nextPageToken
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/exchange/least/:from', VerificationMiddleware.verifyLeastExchangeRateRequest, (req, res) => {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(req.params.from);
  ExchangeRateService.queryLeastExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    res.jsonForSuccessResponse({
      base: exchangeRateRequest.baseCurrency,
      from: rateCollection.minDate.format('YYYYMMDD'),
      to: rateCollection.maxDate.format('YYYYMMDD'),
      rates: rateCollection.serialize(),
      nextPageToken: rateCollection.nextPageToken
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/convert/historical/:from/to/:to', VerificationMiddleware.verifyHistoricalConversionRateRequest, (req, res) => {
  let conversionRequest = ConversionRateRequest.convertFrom(req.params.from)
    .target(req.params.to)
    .startFrom(req.query.startDate)
    .endOf(req.query.endDate)
    .withAmount(req.query.amount);
  ExchangeRateService.queryConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    res.jsonForSuccessResponse({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: conversionRequest.startDate.format('YYYYMMDD'),
      to: conversionRequest.endDate.format('YYYYMMDD'),
      rates: conversionRate.serialize(),
      nextPageToken: conversionRate.nextPageToken
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/convert/least/:from/to/:to', VerificationMiddleware.verifyLeastConversionRequest, (req, res) => {
  let conversionRequest = ConversionRateRequest.convertFrom(req.params.from)
    .target(req.params.to)
    .withAmount(req.query.amount);
  ExchangeRateService.queryLeastConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    res.jsonForSuccessResponse({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: conversionRate.minDate.format('YYYYMMDD'),
      to: conversionRate.maxDate.format('YYYYMMDD'),
      rates: conversionRate.serialize(),
      nextPageToken: conversionRate.nextPageToken
    });
  }).catch(res.jsonForFailureResponse);
});

module.exports = router;
