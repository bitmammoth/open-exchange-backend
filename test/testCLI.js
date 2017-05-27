/**
 * Created by DavidNg on 15/5/2017.
 */
'use strict';

process.env.NODE_ENV = 'testing';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');

chai.should();
const moment = require('moment');
require('mocha');

const importOpenExchangeRate = require('../script/cron/importOpenExchangeRate');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('Test Import Open Exchange Rate API', () => {
  it('Should import open exchange rate of yesterday to DB', () => {
    return importOpenExchangeRate.importOpenExchangeRateOfDate(
      moment().subtract(1, 'days').toDate()
    ).should.be.fulfilled;
  }).timeout(5 * 60 * 1000);// 5 mins
  it('Should import open exchange rate from passed 2 days to DB', () => {
    return importOpenExchangeRate.importOpenExchangeRateOfDateRange(
      moment().subtract(2, 'days').format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD')
    ).should.be.fulfilled;
  }).timeout(5 * 60 * 1000);// 5 mins
});
