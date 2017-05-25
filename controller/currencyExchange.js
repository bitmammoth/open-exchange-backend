
'use strict';
const express = require('express');
const router = express.Router();

const VerificationMiddleware = require('../middleware/validation');
const serviceModel = require('../model/service');
const exchageService = require('../service/exchangerate');

const ExchangeRateRequest = serviceModel.ExchangeRateRequest;
const ConversionRateRequest = serviceModel.ConversionRateRequest;

// TODO: All API missing pagination mechanism, should be implement before launch
router.get('/exchange/historical/:from', VerificationMiddleware.verifyHistoricalExchangeRateRequest, (req, res) => {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(req.params.from)
    .startFrom(req.query.startDate)
    .endOf(req.query.endDate);
  exchageService.queryExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    res.jsonForSuccessResponse({
      base: exchangeRateRequest.baseCurrency,
      from: exchangeRateRequest.startDate.format('YYYYMMDD'),
      to: exchangeRateRequest.endDate.format('YYYYMMDD'),
      rates: rateCollection.serialize()
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/exchange/least/:from', VerificationMiddleware.verifyLeastExchangeRateRequest, (req, res) => {
  let exchangeRateRequest = ExchangeRateRequest.exchangeRateBaseOn(req.params.from);
  exchageService.queryLeastExchangeRateBaseOnCurrency(exchangeRateRequest).then((rateCollection) => {
    res.jsonForSuccessResponse({
      base: exchangeRateRequest.baseCurrency,
      from: rateCollection.minDate.format('YYYYMMDD'),
      to: rateCollection.maxDate.format('YYYYMMDD'),
      rates: rateCollection.serialize()
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/convert/historical/:from/to/:to', VerificationMiddleware.verifyHistoricalConversionRateRequest, (req, res) => {
  let conversionRequest = ConversionRateRequest.convertFrom(req.params.from)
    .target(req.params.to)
    .startFrom(req.query.startDate)
    .endOf(req.query.endDate)
    .withAmount(req.query.amount);
  exchageService.queryConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    res.jsonForSuccessResponse({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: conversionRequest.startDate.format('YYYYMMDD'),
      to: conversionRequest.endDate.format('YYYYMMDD'),
      rates: conversionRate.serialize()
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/convert/least/:from/to/:to', VerificationMiddleware.verifyLeastConversionRequest, (req, res) => {
  let conversionRequest = ConversionRateRequest.convertFrom(req.params.from)
    .target(req.params.to)
    .withAmount(req.query.amount);
  exchageService.queryLeastConversionRateBaseOnCurrency(conversionRequest).then((conversionRate) => {
    res.jsonForSuccessResponse({
      base: conversionRequest.baseCurrency,
      targetCurrency: conversionRequest.targetCurrency,
      baseAmount: conversionRequest.amount,
      from: conversionRate.minDate.format('YYYYMMDD'),
      to: conversionRate.maxDate.format('YYYYMMDD'),
      rates: conversionRate.serialize()
    });
  }).catch(res.jsonForFailureResponse);
});

module.exports = router;
