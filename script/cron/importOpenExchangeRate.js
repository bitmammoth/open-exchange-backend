'use strict';
/**
 * @module CLI
 * @description Cron script for download and import openexchangerate daily execute.
 */

const moment = require('moment');

const functionHelper = require('../../helper/functional');
const OpenExchangeRateService = require('../../service/thirdparty');
const ExchangeRateService = require('../../service/exchangerate');
const logger = require('../../logger');

const PromiseHelper = functionHelper.PromiseHelper;

/**
 * @function
 * @param {Moment} importStartDate
 * @param {Moment} importEndDate
 * @return {Promise<Array>} The result of jobs will be saved into callback data with array.
 * */
function importOpenExchangeRateOfDateRange (importStartDate, importEndDate) {
  let importJobs = [];
  let startDate = moment(importStartDate, 'YYYY-MM-DD');
  let endDate = moment(importEndDate, 'YYYY-MM-DD');
  let currentDate = startDate.clone();
  logger.info(`Import open exchange where ${startDate} <= date < ${endDate}`);
  while (currentDate.isBefore(endDate)) {
    importJobs.push(importOpenExchangeRateOfDate(currentDate.toDate()));
    currentDate = currentDate.add(1, 'days');
  }
  return PromiseHelper.seriesPromise(importJobs);
}

/** Download and import exchange rate into DB
 * @function
 * @param {Moment} importDate
 * @return {Promise} - DyanmoDB#batchWriteItem
 * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchWriteItem-property}
 * */
function importOpenExchangeRateOfDate (importDate) {
  importDate = moment(importDate);
  logger.info({importDate: importDate}, `Import openexhcange date in ${importDate}`);
  return OpenExchangeRateService.getHistoricalExchangeRate(importDate)
      .then((exchangeRates) => {
        logger.info('Success fetch openexchange data from openexchangerates.com');
        return ExchangeRateService.importExchangeRate(exchangeRates);
      });
}

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log(`Use for node importOpenExchangeRate [startDate] [endDate]
  startDate: Starting date of import, Inclusive
  endDate: Ending date of import, Exclusive
`);
  } else {
    importOpenExchangeRateOfDateRange(process.argv[2], process.argv[3]).then((data) => {
      logger.info({data: data}, 'Import open exchange rate completed');
    }, (err) => {
      logger.error({err: err});
    });
  }
}

module.exports = {
  importOpenExchangeRateOfDate: importOpenExchangeRateOfDate,
  importOpenExchangeRateOfDateRange: importOpenExchangeRateOfDateRange
};
