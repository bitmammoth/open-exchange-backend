/**
 * Created by DavidNg on 15/5/2017.
 */
const moment = require('moment');
const AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});
const rp = require('request-promise');

const dynamodb = new AWS.DynamoDB();

function importOpenExchangeRate(importDate){
  //TODO: Implement Retry logic
  importDate = moment(importDate);
  return new Promise((resolve, reject)=>{
    rp.get({
      url: `https://openexchangerates.org/api/historical/${importDate.format('YYYY-MM-DD')}.json`,
      qs: {
        app_id: process.env.OPEN_EXCHANGE_RATE_APP_ID
      },
      json: true
    }).then((repos)=>{
      let rates = {};
      for (let currency in repos.rates){
        if (repos.rates.hasOwnProperty(currency)){
          rates[currency] = {
            'N':String(repos.rates[currency])
          };
        }
      }
      dynamodb.putItem({
        Item:{
          'Rates':{
            'M':rates
          },
          'RateDate':{
            'N':importDate.format('YYYYMMDD')
          }
        },
        TableName: 'ExchangeRates'
      },(err,data)=>{
        if (err){
          reject(err);
          return;
        }
        resolve(data);
      });
    }).catch(reject);
    }
  );
}

if (require.main === module) {
  importOpenExchangeRate(new Date());
}

module.exports = importOpenExchangeRate;