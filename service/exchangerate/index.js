'use strict';

/**
 * @namespace service
 * @module Service
 */
const moment = require('moment');
const AWS = require('aws-sdk');

const db = require('../../model/db');

const dynamodb = new AWS.DynamoDB();
const ExchangeCollection = db.ExchangeRateCollection;
const ConversionRate = db.ConversionRate;

/**
 * @class ExchangeRateService
 * */
class ExchangeRateService {
  /**
   *  @function
   *  @static
   *  @param {ConversionRateRequest} conversionRateRequest
   *  @return {Promise<ConversionRate>}
   * */
  static queryLeastConversionRateBaseOnCurrency (conversionRateRequest) {
    return ExchangeRateService.queryLeastExchangeRateBaseOnCurrency(conversionRateRequest.asExchangeRateRequest())
      .then((rateCollection) => {
        let conversionRate = ConversionRate.convertExchangeRateToTargetCurrency(rateCollection, conversionRateRequest.targetCurrency)
          .multiply(conversionRateRequest.amount);
        return Promise.resolve(conversionRate);
      });
  }
  /**
   *  @function
   *  @static
   *  @param {ConversionRateRequest} conversionRateRequest
   *  @return {Promise<ConversionRate>}
   * */
  static queryConversionRateBaseOnCurrency (conversionRateRequest) {
    return ExchangeRateService.queryExchangeRateBaseOnCurrency(conversionRateRequest.asExchangeRateRequest())
      .then((rateCollection) => {
        let conversionRate = ConversionRate.convertExchangeRateToTargetCurrency(rateCollection, conversionRateRequest.targetCurrency)
        .multiply(conversionRateRequest.amount);
        return Promise.resolve(conversionRate);
      });
  }
  /**
   *  @function
   *  @static
   *  @param {ExchangeRateRequest} exchangeRateRequest
   *  @return {Promise<ExchangeCollection>}
   * */
  static queryExchangeRateBaseOnCurrency (exchangeRateRequest) {
    return dynamodb.query({
      ExpressionAttributeValues: {
        ':startDate': {
          N: exchangeRateRequest.startDate.format('YYYYMMDD')
        },
        ':endDate': {
          N: exchangeRateRequest.endDate.format('YYYYMMDD')
        },
        ':currencyBase': {
          S: exchangeRateRequest.baseCurrency
        }
      },
      KeyConditionExpression: 'RateBase = :currencyBase AND RateDate BETWEEN :startDate AND :endDate',
      TableName: 'ExchangeRates'
    }).promise().then((data) => {
      let rateCollection = ExchangeCollection.fromDynamoDB(data);
      return Promise.resolve(rateCollection);
    });
  }
  /**
   *  @function
   *  @static
   *  @param {ExchangeRateRequest} exchangeRateRequest
   *  @return {Promise<ExchangeCollection>}
   * */
  static queryLeastExchangeRateBaseOnCurrency (exchangeRateRequest) {
    return leastRateDate(exchangeRateRequest.baseCurrency).then((leastRateDate) => {
      return dynamodb.query({
        ExpressionAttributeValues: {
          ':leastDate': {
            N: leastRateDate.format('YYYYMMDD')
          },
          ':currencyBase': {
            S: exchangeRateRequest.baseCurrency
          }
        },
        KeyConditionExpression: 'RateBase = :currencyBase AND RateDate = :leastDate',
        TableName: 'ExchangeRates'
      })
        .promise()
        .then((data) => {
          let rateCollection = ExchangeCollection.fromDynamoDB(data);
          return Promise.resolve(rateCollection);
        });
    });
  }
};

function leastRateDate (baseCurrency) { // Should i hardcoded yesterday instead of fetch from db?
  return new Promise((resolve, reject) => {
    dynamodb.query({
      ExpressionAttributeValues: {
        ':currencyBase': {
          S: baseCurrency
        }
      },
      KeyConditionExpression: 'RateBase = :currencyBase',
      TableName: 'ExchangeRates',
      ScanIndexForward: false, // Sort result descending by sort key,
      Limit: 1 // Only first item is enough
    })
      .promise()
      .then((data) => {
        resolve(moment(data.Items[0].RateDate.N, 'YYYYMMDD'));
      })
      .catch(reject);
  });
}
module.exports = ExchangeRateService;