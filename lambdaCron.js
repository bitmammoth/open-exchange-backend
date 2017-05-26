'use strict';

require('./config');
const moment = require('moment');

const importOpenExchangeRate = require('./script/cron/importOpenExchangeRate');

// http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
exports.handler = (event, context, callback) => {
  let yesterday = moment().subtract(1,'days').format('YYYY-MM-DD');
  importOpenExchangeRate.importOpenExchangeRateOfDate(
    yesterday
  ).then((data) => {
    callback(null,yesterday);
  }).catch((err) => {
    callback(err);
  });
};
