/**
 * Created by DavidNg on 15/5/2017.
 */
const moment = require('moment');

const rp = require('request-promise');

function importOpenExchangeRate(importDate){
  importDate = moment(importDate).format('YYYY-MM-DD');
  console.log(importDate);
  return new Promise((resolve, reject)=>{
    rp.get({
      url: `https://openexchangerates.org/api/historical/${importDate}.json`,
      qs: {
        app_id: process.env.OPEN_EXCHANGE_RATE_APP_ID
      },
      json: true
    }).then((repos)=>{
      resolve(repos);
      //TODO: Import result to DB
    }).catch(reject);
    }
  );
}

if (require.main === module) {
  importOpenExchangeRate(new Date());
}

module.exports = importOpenExchangeRate;