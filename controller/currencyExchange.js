/**
 * Created by ngkongchor on 19/5/2017.
 */

const express = require('express');
const router = express.Router();

const moment = require('moment');
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});
const dynamodb = new AWS.DynamoDB();
//TODO: All API missing pagination mechanism, should be implement before launch
router.get('/exchange/historical/:from', function(req, res) {
  let base = req.params.from;
  let startDate = moment(req.query.startDate,'YYYY-MM-DD');
  let endDate = moment(req.query.endDate, 'YYYY-MM-DD');
  //http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
  dynamodb.query({
    ExpressionAttributeValues:{
      ':startDate':{
        N: startDate.format('YYYYMMDD')
      },
      ':endDate':{
        N: endDate.format('YYYYMMDD')
      },
      ':currencyBase':{
        S: base
      }
    },
    KeyConditionExpression:'RateBase = :currencyBase AND RateDate BETWEEN :startDate AND :endDate',
    TableName: 'ExchangeRates'
  }).promise().then((data)=>{
    let rates = {};
    for (let dailyExchangeRate of data.Items){
      let currenciesRatesFromBase = rates[dailyExchangeRate.RateDate.N] = {};
      for (let currency in dailyExchangeRate.Rates.M){
        if (dailyExchangeRate.Rates.M.hasOwnProperty(currency)){
          let currencyRateOfBase = dailyExchangeRate.Rates.M[currency];
          currenciesRatesFromBase[currency] = Number(currencyRateOfBase.N);
        }
      }
    }
    res.jsonForSuccessResponse({
      base:base,
      from:startDate.format('YYYYMMDD'),
      to:endDate.format('YYYYMMDD'),
      rates:rates
    });
  }).catch(res.jsonForFailureResponse);
});

router.get('/exchange/least/:from', function(req, res) {
  let base = req.params.from;
  leastRateDate(base).then((leastRateDate)=>{
    dynamodb.query({
      ExpressionAttributeValues:{
        ':leastDate':{
          N: leastRateDate.format('YYYYMMDD')
        },
        ':currencyBase':{
          S: base
        }
      },
      KeyConditionExpression:'RateBase = :currencyBase AND RateDate = :leastDate',
      TableName: 'ExchangeRates'
    }).promise().then((data)=>{
      let rates = {};
      for (let dailyExchangeRate of data.Items){
        let currenciesRatesFromBase = rates[dailyExchangeRate.RateDate.N] = {};
        for (let currency in dailyExchangeRate.Rates.M){
          if (dailyExchangeRate.Rates.M.hasOwnProperty(currency)){
            let currencyRateOfBase = dailyExchangeRate.Rates.M[currency];
            currenciesRatesFromBase[currency] = Number(currencyRateOfBase.N);
          }
        }
      }
      res.jsonForSuccessResponse({
        base:base,
        from:leastRateDate.format('YYYYMMDD'),
        to:leastRateDate.add(1,'days').format('YYYYMMDD'),
        rates:rates
      });
    }).catch(res.jsonForFailureResponse);

  }).catch(res.jsonForFailureResponse);
});

function leastRateDate(baseCurrency){
  return new Promise((resolve,reject)=>{dynamodb.query({
    ExpressionAttributeValues:{
      ':currencyBase':{
        S: baseCurrency
      }
    },
    KeyConditionExpression:'RateBase = :currencyBase',
    TableName: 'ExchangeRates',
    ScanIndexForward: false, //Sort result descending by sort key,
    Limit: 1 //Only first item is enough
  })
    .promise()
    .then((data)=>{
      resolve(moment(data.Items[0].RateDate.N,'YYYYMMDD'));
    })
    .catch(reject)
  });
}

router.get('/convert/least/:from/to/:to', function(req, res) {
  let base = req.params.from;
  let targetCurrency = req.params.to;
  let baseCurrencyAmount = req.query.amount;
  leastRateDate(base).then((leastRateDate)=>{
    dynamodb.query({
      ExpressionAttributeValues:{
        ':leastDate':{
          N: leastRateDate.format('YYYYMMDD')
        },
        ':currencyBase':{
          S: base
        }
      },
      KeyConditionExpression:'RateBase = :currencyBase AND RateDate = :leastDate',
      TableName: 'ExchangeRates'
    }).promise().then((data)=>{
      let rates = {};
      for (let dailyExchangeRate of data.Items){
        for (let currency in dailyExchangeRate.Rates.M){
          if (dailyExchangeRate.Rates.M.hasOwnProperty(currency)){
            if (currency === targetCurrency) {
              let currencyRateOfBase = dailyExchangeRate.Rates.M[currency];
              rates[dailyExchangeRate.RateDate.N] = Number(currencyRateOfBase.N) * baseCurrencyAmount;
            }
          }
        }
      }
      res.jsonForSuccessResponse({
        base:base,
        targetCurrency: targetCurrency,
        baseAmount: baseCurrencyAmount,
        from:leastRateDate.format('YYYYMMDD'),
        to:leastRateDate.add(1,'days').format('YYYYMMDD'),
        rates:rates
      });
    }).catch(res.jsonForFailureResponse);

  }).catch(res.jsonForFailureResponse);
});

router.get('/convert/historical/:from/to/:to', function(req, res) {
  let base = req.params.from;
  let startDate = moment(req.query.startDate,'YYYY-MM-DD');
  let endDate = moment(req.query.endDate, 'YYYY-MM-DD');
  let targetCurrency = req.params.to;
  let baseCurrencyAmount = Number(req.query.amount);
  //http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
  dynamodb.query({
    ExpressionAttributeValues:{
      ':startDate':{
        N: startDate.format('YYYYMMDD')
      },
      ':endDate':{
        N: endDate.format('YYYYMMDD')
      },
      ':currencyBase':{
        S: base
      }
    },
    KeyConditionExpression:'RateBase = :currencyBase AND RateDate BETWEEN :startDate AND :endDate',
    TableName: 'ExchangeRates'
  }).promise().then((data)=>{
    let rates = {};
    for (let dailyExchangeRate of data.Items){
      for (let currency in dailyExchangeRate.Rates.M){
        if (dailyExchangeRate.Rates.M.hasOwnProperty(currency)){
          if (currency === targetCurrency) {
            let currencyRateOfBase = dailyExchangeRate.Rates.M[currency];
            rates[dailyExchangeRate.RateDate.N] = Number(currencyRateOfBase.N) * baseCurrencyAmount;
          }
        }
      }
    }
    res.jsonForSuccessResponse({
      base:base,
      targetCurrency: targetCurrency,
      baseAmount: baseCurrencyAmount,
      from:startDate.format('YYYYMMDD'),
      to:endDate.format('YYYYMMDD'),
      rates:rates
    });
  }).catch(res.jsonForFailureResponse);
});

module.exports = router;