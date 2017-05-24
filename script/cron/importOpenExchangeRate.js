/**
 * Created by DavidNg on 15/5/2017.
 */
"use strict";

const moment = require('moment');
const AWS = require('aws-sdk');
const config = require('../../config');

const rp = require('request-promise');

const dynamodb = new AWS.DynamoDB();

function importOpenExchangeRateOfDateRange(importStartDate, importEndDate){
  let importJobs = [];
  let startDate = moment(importStartDate, 'YYYY-MM-DD');
  let endDate = moment(importEndDate, 'YYYY-MM-DD');
  let currentDate = startDate.clone();
  while (currentDate.isBefore(endDate)){
    importJobs.push(importOpenExchangeRateOfDate(currentDate.toDate()));
    currentDate = currentDate.add(1, 'days');
  }
  return seriesPromise(importJobs);
}


function importOpenExchangeRateOfDate(importDate){
  importDate = moment(importDate);
  return new Promise((resolve, reject)=>{
    rp.get({
      url: `https://openexchangerates.org/api/historical/${importDate.format('YYYY-MM-DD')}.json`,
      qs: {
        app_id: config.env.OPEN_EXCHANGE_RATE_APP_ID
      },
      json: true
    }).then((repos)=>{
      let originalBaseCurrency = repos.base;
      let rates = repos.rates;
      let currencies = Object.keys(rates).filter((currency)=>currency!==originalBaseCurrency);
      let ratesOfDifferenceCurrency = currencies.map((targetCurrency)=>{
        let currenciesExcludeTargetCurrency = currencies.filter((currency)=>currency!==targetCurrency);
        let exchangeRateOfTargetCurrency = Number(rates[targetCurrency]);
        let exchangeRateBaseOfTargetCurrency = {};
        for (let currency of currenciesExcludeTargetCurrency){
          let exchangeRateOfCurrency = Number(rates[currency]);
          exchangeRateBaseOfTargetCurrency[currency] = exchangeRateOfCurrency/exchangeRateOfTargetCurrency;
        }
        return {
          base:targetCurrency,
          rates:exchangeRateBaseOfTargetCurrency
        };
      });
      ratesOfDifferenceCurrency.push({
          base:originalBaseCurrency,
          rates:rates
        }
      );
      ratesOfDifferenceCurrency = ratesOfDifferenceCurrency.map((rateOfCurrency)=>{
        let rates = {};
        for (let currency in rateOfCurrency.rates){
          if (rateOfCurrency.rates.hasOwnProperty(currency)){
            rates[currency] = {
              N : String(rateOfCurrency.rates[currency])
            };
          }
        }
        return {
          PutRequest: {
            Item:{
              'Rates':{
                'M':rates
              },
              'RateDate':{
                'N':importDate.format('YYYYMMDD')
              },
              'RateBase':{
                'S':rateOfCurrency.base
              }
            }
          }
        }

      });
      batchWriteDB("ExchangeRates", ratesOfDifferenceCurrency)
        .then(resolve)
        .catch(reject);
    }).catch(reject);
    }
  );
}

function batchWriteDB(tableName,requestItems){
  let batchRequestItems = arrayChunk(requestItems,25);
  let batchWriteJobs = batchRequestItems.map((requestItems)=>{
    let batchRequires = {};
    batchRequires[tableName] = requestItems;
    return batchWriteItemWillRetryUnprocessedItems(batchRequires);
  });
  return seriesPromise(batchWriteJobs);
}


/**
 * Will chunk array to specific size
 *
 * Example:
 *  let source = [1,2,3,4,5,6,7,8,9,10];
 *  arrayChuck(source,2);
 *  [[1,2],[3,4],[5,6],[7,8],[9,10]]
 * **/
function arrayChunk(arrayToChunk,chunkSize){
  let start = 0;
  let end = chunkSize;
  let chunks = [];
  let resultArrayIsNotEqualSized = arrayToChunk.length%chunkSize !== 0;
  let chunksLength = arrayToChunk.length/chunkSize;
  if (resultArrayIsNotEqualSized){
    chunksLength = Math.floor(chunksLength) +1
  }
  for (let i=0;i<chunksLength;i++){
    start = i * chunkSize;
    end = start + chunkSize;
    chunks.push(arrayToChunk.slice(start, end));
  }
  return chunks;
}

function batchWriteItemWillRetryUnprocessedItems(requestItems){
  let batchWriteParams = {
    RequestItems: requestItems
  }
  return new Promise((resolve,reject)=>{
    awsAPIRetry(dynamodb.batchWriteItem.bind(dynamodb))(batchWriteParams).then((data)=>{
      if (Object.keys(data.UnprocessedItems).length > 0){
        return batchWriteItemWillRetryUnprocessedItems(data.UnprocessedItems)
          .then(resolve)
          .catch(reject);
      }
      else{
        resolve(data);
      }
    }).catch(reject);
  });
}

function awsAPIRetry(functionNeedIncludeRetry, retryCount=0){
  return (...args)=>{//Will by pass to aws SDK function
    return new Promise((resolve,reject)=>{
      functionNeedIncludeRetry.apply({}, args).promise()//http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-promises.html
        .then(resolve)
        .catch((err)=>{//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Response.html#error-property
          let isErrorCanRetry = err.retryable;
          let retryAfterMS = 1000 * (retryCount+1);
          if (err.retryDelay){
            retryAfterMS = err.retryDelay * 1000
          }
          if (isErrorCanRetry){
            return new Promise((resolve, reject)=>{
              setTimeout(
                ()=>{
                  awsAPIRetry(functionNeedIncludeRetry,retryCount+1).apply({},args).then(resolve).catch(reject);
                }
                ,retryAfterMS
              );
            })
            .then(resolve)
            .catch(reject);
          }
          else{
            reject(err);
          }
        });
    }

    );
  }
}

function seriesPromise(promiseJobs){
  let promiseWillSeriesExecute = Promise.resolve();
  promiseJobs.forEach(function(promiseJob){
    promiseWillSeriesExecute = promiseWillSeriesExecute
      .then(()=>{return promiseJob;})
      .catch((err)=>{
        console.log(err);
      });
  });
  return promiseWillSeriesExecute;
}

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log(`Use for node importOpenExchangeRate [startDate] [endDate]
  startDate: Starting date of import, Inclusive
  endDate: Ending date of import, Exclusive
`);
  }
  else {
    importOpenExchangeRateOfDateRange(process.argv[2],process.argv[3]);
  }
}

module.exports = {
  importOpenExchangeRateOfDate: importOpenExchangeRateOfDate,
  importOpenExchangeRateOfDateRange: importOpenExchangeRateOfDateRange
};
