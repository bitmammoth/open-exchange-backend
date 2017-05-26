'use strict';

/**
 * @module ExchangeRateRepository
 */
const AWS = require('aws-sdk');

const config = require('../../config');
const DateHelper = require('../../helper/date');
const dbModel = require('../../model/db');

const ExchangeRate = dbModel.ExchangeRate;
const dynamodb = new AWS.DynamoDB();

/**
 * @class
 * @memberOf module:ExchangeRateRepository
 */
class ExchangeRateRepository {
  /** Query exchange rate during given date range
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {Moment} startDate - Inclusive date
   * @param {Moment} endDate - Exclusive date
   * @param {String} baseCurrency
   * @return {Promise<ExchangeRate>}
   * */
  static historicalExchangeRate (startDate, endDate, baseCurrency) {
    return dynamodb.query({
      ExpressionAttributeValues: {
        ':startDate': {
          N: startDate.format('YYYYMMDD')
        },
        ':endDate': {
          N: endDate.format('YYYYMMDD')
        },
        ':currencyBase': {
          S: baseCurrency
        }
      },
      KeyConditionExpression: 'RateBase = :currencyBase AND RateDate BETWEEN :startDate AND :endDate',
      TableName: config.aws.DYNAMO_DB_TABLE_NAME
    }).promise().then((data) => {
      let rateCollection = ExchangeRateRepository.exchangeRateFromDynamoDBResponse(data);
      return Promise.resolve(rateCollection);
    });
  }

  /** Query least updated exchange rate
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {String} baseCurrency - Inclusive date
   * @return {Promise<ExchangeRate>}
   * */
  static leastExchangeRate (baseCurrency) {
    return ExchangeRateRepository.leastSavedExchangeRateDate(baseCurrency).then((leastRateDate) => {
      return dynamodb.query({
        ExpressionAttributeValues: {
          ':leastDate': {
            N: DateHelper.dateToDateInt(leastRateDate)
          },
          ':currencyBase': {
            S: baseCurrency
          }
        },
        KeyConditionExpression: 'RateBase = :currencyBase AND RateDate = :leastDate',
        TableName: config.aws.DYNAMO_DB_TABLE_NAME
      })
        .promise()
        .then((data) => {
          let rateCollection = ExchangeRateRepository.exchangeRateFromDynamoDBResponse(data);
          return Promise.resolve(rateCollection);
        });
    });
  }

  /**
   * Will return least updated date of currency rate
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {String} baseCurrency
   * @return {Promise<Moment>}
   * */
  static leastSavedExchangeRateDate (baseCurrency) {
    return new Promise((resolve, reject) => {
      dynamodb.query({
        ExpressionAttributeValues: {
          ':currencyBase': {
            S: baseCurrency
          }
        },
        KeyConditionExpression: 'RateBase = :currencyBase',
        TableName: config.aws.DYNAMO_DB_TABLE_NAME,
        ScanIndexForward: false, // Sort result descending by sort key,
        Limit: 1 // Only first item is enough
      })
        .promise()
        .then((data) => {
          resolve(DateHelper.dateIntToDate(data.Items[0].RateDate.N));
        })
        .catch(reject);
    });
  }
  /**
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {Moment} importDate - Value should same as date you passed to openexchange in API call
   * @param {OpenExchangeAPIResponse} openExchangeAPIResponse - JSON return from open exchange rate API
   * @return {ExchangeRate}
   * */
  static exchangeRateFromOpenExchangeAPIResponse (importDate, openExchangeAPIResponse) {
    let rates = openExchangeAPIResponse.rates;
    let dateInt = DateHelper.dateToDateInt(importDate);
    let currencies = Object.keys(rates);
    let exchangeRateCollection;
    exchangeRateCollection = currencies.map((targetCurrency) => {
      let exchangeRate = ExchangeRate.exchangeRateOfDay(targetCurrency, importDate);
      let currenciesExcludeTargetCurrency = currencies.filter((currency) => currency !== targetCurrency);
      let exchangeRateOfTargetCurrency = Number(rates[targetCurrency]);
      exchangeRate.allCurrency = new Set(currenciesExcludeTargetCurrency);
      for (let currency of currenciesExcludeTargetCurrency) {
        let exchangeRateOfCurrency = Number(rates[currency]);
        exchangeRate.push(dateInt, currency, exchangeRateOfCurrency / exchangeRateOfTargetCurrency);
      }
      return exchangeRate;
    });
    return exchangeRateCollection;
  }
  /**
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {DynamoDBResponse} dynamoDBResponse - Record return from AWS SDK response.
   * @return {ExchangeRate}
   * */
  static exchangeRateFromDynamoDBResponse (dynamoDBResponse) {
    let exchangeRate = new ExchangeRate();
    let items = dynamoDBResponse.Items;
    for (let dailyExchangeRate of items) {
      let rates = dailyExchangeRate.Rates.M;
      let dateInt = dailyExchangeRate.RateDate.N;
      let rateBase = dailyExchangeRate.RateBase.S;
      let day = DateHelper.dateIntToDate(dateInt);
      exchangeRate.baseCurrency = rateBase;
      for (let currency in rates) {
        if (rates.hasOwnProperty(currency)) {
          let currencyRateOfBase = rates[currency].N;
          let rate = Number(currencyRateOfBase);
          exchangeRate.updateMinDate(day);
          exchangeRate.updateMaxDate(day);
          exchangeRate.registerDate(dateInt);
          exchangeRate.registerCurrency(currency);
          exchangeRate.push(dateInt, currency, rate);
        }
      }
    }
    return exchangeRate;
  }

  /**
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {ExchangeRate} exchangeRate - Record return from AWS SDK response.
   * @return {Array<DynamoDBPutRequest>}
   * */
  static exchangeRateToDynamoDBPutRequest (exchangeRate) {
    let rateDate = DateHelper.dateToDateInt(exchangeRate.minDate);
    let putRequest = {
      PutRequest: {
        Item: {
          'Rates': {
            'M': {}
          },
          'RateDate': {
            'N': rateDate
          },
          'RateBase': {
            'S': exchangeRate.baseCurrency
          }
        }
      }
    };
    let rates = putRequest.PutRequest.Item.Rates.M;
    for (let currency of exchangeRate.allCurrency) {
      let currencyExchangeRate = exchangeRate.rateForDate(rateDate, currency);
      rates[currency] = {
        N: String(currencyExchangeRate)
      };
    }
    return putRequest;
  }
}

module.exports = ExchangeRateRepository;

/**
 * @typedef DynamoDBResponse
 * @type {Object}
 * @property {Array<DynamoDBItem>} Items
 * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#query-property} for full response structure
 * */
/**
 * @typedef DynamoDBItem
 * @type {Object}
 * @property {DynamoDBNumber} RateDate
 * @property {DynamoDBString} RateBase
 * @property {Object} Rates - An Object that using 3 little currency as key and value is {DynamoDBNumber}
 * */
/**
 * @typedef DynamoDBString
 * @type {Object}
 * @property {Object} S
 * */
/**
 * @typedef DynamoDBMap
 * @type {Object}
 * @property {Object} M
 * */
/**
 * @typedef DynamoDBNumber
 * @type {Object}
 * @property {Object} N
 * */
/**
 * @typedef DynamoDBPutRequest
 * @type {Object}
 * @property {DynamoDBPutRequestItem} PutRequest
 * */
/**
 * @typedef DynamoDBPutRequestItem
 * @type {Object}
 * @property {DynamoDBItem} Item
 * */
/**
 * @typedef OpenExchangeAPIResponse
 * @type {Object}
 * @property {String} base -  3-letter currency code to which all the delivered exchange rates are relative
 * @property {Object} rates - An object containing all the conversion or exchange rates for all of the available currencies, labeled by their international-standard 3-letter currency codes. All the values are relative to 1 unit of the requested base currency.
 * @property {Number} timestamp - time (UNIX) that the rates were published. (If you’re using the timestamp value in JavaScript, remember to multiply it by 1000, because JavaScript uses time in milliseconds instead of seconds.)
 * @see {@link: https://docs.openexchangerates.org/docs/historical-json}
 * */
