/**
 * Created by ngkongchor on 19/5/2017.
 */

const express = require('express');
const router = express.Router();

const moment = require('moment');
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});
const dynamodb = new AWS.DynamoDB();

router.get('/exchange/:from', function(req, res) {
  let base = req.params.from;
  let startDate = moment(req.query.startDate,'YYYY-MM-DD');
  let endDate = moment(req.query.endDate, 'YYYY-MM-DD');
  let targetCurrency = req.query.to;
  //http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
  dynamodb.query(
    {
      ExpressionAttributeValues:{
        ":startDate":{
           N: startDate.format('YYYYMMDD')
        },
        ":endDate":{
          N: endDate.format('YYYYMMDD')
        },
        ":currencyBase":{
          S: base
        }
      },
      KeyConditionExpression:"RateBase = :currencyBase AND RateDate BETWEEN :startDate AND :endDate",
      TableName: "ExchangeRates"
    },(err,data)=>{
      if (err){
        return;
      }
      let rates = {};
      for (let dailyExchangeRate of data.Items){
        let currenciesRatesFromBase = rates[dailyExchangeRate.RateDate.N] = [];
        for (let currency in dailyExchangeRate.Rates.M){
          if (currency === targetCurrency && dailyExchangeRate.Rates.M.hasOwnProperty(currency)){
            let currencyRateOfBase = dailyExchangeRate.Rates.M[currency];
            currencyRateOfBase.currency = currency;
            currencyRateOfBase.rate = currencyRateOfBase.N;
            currenciesRatesFromBase.push(currencyRateOfBase);
          }
        }

      }
      res.jsonForSuccessResponse({
        base:base,
        from:startDate,
        to:endDate,
        rates:rates
      });
    }
  );

});

module.exports = router;