'use strict';

/**
 * @module ExchangeRateRepository
 */
const AWS = require('aws-sdk');

const config = require('../../config');
const DateHelper = require('../../helper/date');
const dbModel = require('../../model/db');
const error = require('../../error');
const logger = require('../../logger');
const functionHelper = require('../../helper/functional');
const awsHelper = require('../../helper/aws');

const dynamodb = new AWS.DynamoDB();
const ExchangeRateCollectionBuilder = dbModel.ExchangeRateCollectionBuilder;
const DBNoResultError = error.DBNoResultError;
const ArrayHelper = functionHelper.ArrayHelper;
const PromiseHelper = functionHelper.PromiseHelper;
const AsyncHelper = functionHelper.AsyncHelper;
const DynamoDBHelper = awsHelper.DynamoDBHelper;

/**
 * @class
 * @memberOf module:ExchangeRateRepository
 */
class ExchangeRateRepository {
  /**
   *  @function
   *  @static
   *  @function
   *  @memberOf module:ExchangeRateRepository
   *  @param {Array<ExchangeRate>} exchangeRates
   *  @return {Promise<ConversionRate>}
   * */
  static importExchangeRate (exchangeRates) {
    let insertJobs = ArrayHelper.arrayChunk(exchangeRates, config.aws.DYNAMO_DB_WRITE_BATCH_LIMIT).map((exchangeRate, index) => {
      let request = {};
      request[config.aws.DYNAMO_DB_TABLE_NAME] = exchangeRate.map(ExchangeRateRepository.exchangeRateToDynamoDBPutRequest);
      logger.debug(`Require write open exchange rate batch[${index}] to Dynamo DB`);
      return PromiseHelper.wrapPromiseWithCallback(DynamoDBHelper.batchWriteItemWillRetryUnprocessedItems)(request);
    });
    return AsyncHelper.series(insertJobs);
  }

  /**
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {ExchangeRate} exchangeRate - Record return from AWS SDK response.
   * @return {Array<DynamoDBPutRequest>}
   * */
  static exchangeRateToDynamoDBPutRequest (exchangeRate) {
    let rateDate = exchangeRate.minDate;
    let putRequest = {
      PutRequest: {
        Item: {
          'Rates': {
            'M': {}
          },
          'RateDate': {
            'N': String(rateDate)
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

  /** Query exchange rate during given date range
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {Moment} startDate - Inclusive date
   * @param {Moment} endDate - Exclusive date
   * @param {String} baseCurrency
   * @param {Object} [exclusiveStartKey] - Will pass to SDK 'ExclusiveStartKey' field
   * @return {Promise<ExchangeRate>}
   * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#query-property}
   * */
  static historicalExchangeRate (startDate, endDate, baseCurrency, exclusiveStartKey) {
    let queryParams = {
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
      TableName: config.aws.DYNAMO_DB_TABLE_NAME,
      ExclusiveStartKey: exclusiveStartKey // TODO: pagination should separate function handle
    };
    if (config.env.NODE_ENV === 'testing') {
      logger.warn('DB return always 1 due to testing mode');
      queryParams['Limit'] = config.mock.DYNAMO_DB_TESTING_RESULT_SET_LIMIT;
    }
    return dynamodb.query(queryParams).promise().then((data) => {
      let rateCollection = ExchangeRateRepository.exchangeRateFromDynamoDBResponse(data);
      return Promise.resolve(rateCollection);
    });
  }

  /**
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {DynamoDBResponse} dynamoDBResponse - Record return from AWS SDK response.
   * @return {ExchangeRate}
   * */
  static exchangeRateFromDynamoDBResponse (dynamoDBResponse) {
    let exchangeRateBuilder = new ExchangeRateCollectionBuilder();
    let items = dynamoDBResponse.Items;
    if (items.length === 0) {
      throw new DBNoResultError();
    }
    for (let dailyExchangeRate of items) {
      let rates = dailyExchangeRate.Rates.M;
      let dateInt = dailyExchangeRate.RateDate.N;
      exchangeRateBuilder.baseCurrency = dailyExchangeRate.RateBase.S;
      for (let currency in rates) {
        if (rates.hasOwnProperty(currency)) {
          let currencyRateOfBase = rates[currency].N;
          let rate = Number(currencyRateOfBase);
          exchangeRateBuilder.addExchangeRateRecord(dateInt, currency, rate);
        }
      }
    }
    let exchangeRate = exchangeRateBuilder.build();
    if (dynamoDBResponse.LastEvaluatedKey) {
      logger.debug({key: dynamoDBResponse.LastEvaluatedKey}, 'Result has more item');
      exchangeRate.nextPageToken = DynamoDBHelper.pageTokenFromLastEvaluatedKey(dynamoDBResponse.LastEvaluatedKey);
    }
    return exchangeRate;
  }

  /** Query least updated exchange rate
   * @static
   * @function
   * @memberOf module:ExchangeRateRepository
   * @param {String} baseCurrency - Inclusive date
   * @param {Object} [exclusiveStartKey] - Will pass to SDK 'ExclusiveStartKey' field
   * @return {Promise<ExchangeRate>}
   * */
  static leastExchangeRate (baseCurrency, exclusiveStartKey) {
    return ExchangeRateRepository.leastSavedExchangeRateDate(baseCurrency).then((leastRateDate) => {
      let queryParams = {
        ExpressionAttributeValues: {
          ':leastDate': {
            N: DateHelper.dateToDateInt(leastRateDate)
          },
          ':currencyBase': {
            S: baseCurrency
          }
        },
        KeyConditionExpression: 'RateBase = :currencyBase AND RateDate = :leastDate',
        TableName: config.aws.DYNAMO_DB_TABLE_NAME,
        ExclusiveStartKey: exclusiveStartKey // TODO: pagination should separate function handle
      };
      if (config.env.NODE_ENV === 'testing') {
        logger.warn('DB return always 1 due to testing mode');
        queryParams['Limit'] = config.mock.DYNAMO_DB_TESTING_RESULT_SET_LIMIT;
      }
      return dynamodb.query(queryParams)
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
          let dynamoDBItem = data.Items[0];
          if (dynamoDBItem) {
            resolve(DateHelper.dateIntToDate(dynamoDBItem.RateDate.N));
          } else {
            reject(new DBNoResultError());
          }
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
    let currencies = Object.keys(rates);
    let exchangeRateCollection;
    exchangeRateCollection = currencies.map((targetCurrency) => {
      let exchangeRateBuilder = new ExchangeRateCollectionBuilder(targetCurrency);
      exchangeRateBuilder.registerDate(DateHelper.dateToDateInt(importDate));
      let currenciesExcludeTargetCurrency = currencies.filter((currency) => currency !== targetCurrency);
      let exchangeRateOfTargetCurrency = Number(rates[targetCurrency]);
      exchangeRateBuilder.allCurrency = new Set(currenciesExcludeTargetCurrency);
      for (let currency of currenciesExcludeTargetCurrency) {
        let exchangeRateOfCurrency = Number(rates[currency]);
        exchangeRateBuilder.addExchangeRateRecordForCurrency(currency, exchangeRateOfCurrency / exchangeRateOfTargetCurrency);
      }
      return exchangeRateBuilder.build();
    });
    return exchangeRateCollection;
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
