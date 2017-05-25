/**
 * Created by DavidNg on 15/5/2017.
 */
'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');

const app = require('../app');
chai.should();
const moment = require('moment');
require('mocha');

const importOpenExchangeRate = require('../script/cron/importOpenExchangeRate');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('Testing Response Structure', () => {
  it('Should Error', (done) => {
    chai.request(app).get('/404-page-not-found').end((err, res) => {
      res.body.success.should.be.eql(false);
      done();
    });
  });
  it('Should Success', (done) => {
    chai.request(app).get('/').end((err, res) => {
      res.body.success.should.be.eql(true);
      done();
    });
  });
});

describe('Testing Currency API', () => {
  it('Should base on USD return exchange rate on passed 10 days', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: moment().subtract(10, 'days').toDate().toISOString(),
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Should error due to incorrect date format', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: moment().subtract(10, 'days').format('MM-DD-YYYY'),
        endDate: moment().format('MM-DD-YYYY')// exclusive, meaning startDate >= date > endDate
      })
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
  it('Should error due to endDate <= StartDate', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: new Date().toISOString(), // exclusive, meaning startDate >= date > endDate
        endDate: moment().subtract(10, 'days').toDate().toISOString()
      })
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
  it('Should base on USD return exchange rate on least import date', (done) => {
    chai.request(app).get('/currency/exchange/least/USD')
      .end((err, res) => {
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Should base on USD return relative value of HKD on passed 10 days', (done) => {
    chai.request(app).get('/currency/convert/historical/USD/to/HKD')
      .query({
        amount: 10.0,
        startDate: moment().subtract(10, 'days').toDate().toISOString(),
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Should error due to incorrect date format in conversion API', (done) => {
    chai.request(app).get('/currency/convert/historical/USD/to/HKD')
      .query({
        amount: 10.0,
        startDate: moment().subtract(10, 'days').format('MM-DD-YYYY'),
        endDate: moment().format('MM-DD-YYYY')
      })
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
  it('Should base on USD return relative value of HKD on least import date', (done) => {
    chai.request(app).get('/currency/convert/least/USD/to/HKD')
      .query({
        amount: 10.0
      })
      .end((err, res) => {
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Should error due to non number ', (done) => {
    chai.request(app).get('/currency/convert/least/USD/to/HKD')
      .query({
        amount: 'Non number string'
      })
      .end((err, res) => {
        res.should.have.status(400);
        done();
      });
  });
});

describe('Test Open Exchange Rate API', () => {
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
