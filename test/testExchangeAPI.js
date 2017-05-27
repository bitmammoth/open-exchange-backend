/**
 * Created by DavidNg on 15/5/2017.
 */
'use strict';

process.env.NODE_ENV = 'testing';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');
require('mocha');

const app = require('../app');

chai.should();
chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('Testing historical Exchange API', () => {
  it('base on USD on passed 10 days', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: moment().subtract(10, 'days').toDate().toISOString(),
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.body.data.should.have.property('next_page_token');
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('base on HKD on passed 10 days', (done) => {
    chai.request(app).get('/currency/exchange/historical/HKD')
      .query({
        startDate: moment().subtract(10, 'days').toDate().toISOString(),
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.body.data.should.have.property('next_page_token');
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('base on HKD from YTD', (done) => {
    chai.request(app).get('/currency/exchange/historical/HKD')
      .query({
        startDate: moment().startOf('year').toDate().toISOString(),
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.body.data.should.have.property('next_page_token');
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Pagination base on HKD from YTD', (done) => {
    let startDate = moment().startOf('year').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'HKD';
    getHistoricalExchangeRateBaseOn(base, startDate, endDate)
      .end((_err, _res) => {
        _res.body.data.should.have.property('next_page_token');
        let page2Token = _res.body.data.next_page_token; // Token required to fetch page 2.
        getHistoricalExchangeRateBaseOn(base, startDate, endDate, page2Token)
          .end((err, res) => {
            res.body.data.should.have.property('next_page_token');
            let page3Token = res.body.data.next_page_token;// Token required to fetch page 3.
            page2Token.should.not.equal(page3Token);
            console.log(page3Token);
            done();
          });
      });
  });
});

function getHistoricalExchangeRateBaseOn (currency, startDate, endDate, pageToken) {
  return chai.request(app).get(`/currency/exchange/historical/${currency}`)
    .query({
      startDate: startDate,
      endDate: endDate,
      pageToken: pageToken
    });
}

describe('Testing least Exchange API', () => {
  it('base on USD on least import date', (done) => {
    chai.request(app).get('/currency/exchange/least/USD')
      .end((err, res) => {
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('base on HKD on least import date', (done) => {
    chai.request(app).get('/currency/exchange/least/HKD')
      .end((err, res) => {
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
});

describe('Testing historical exchange API Error', () => {
  it('Incorrect date format', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: moment().subtract(10, 'days').format('MM-DD-YYYY'),
        endDate: moment().format('MM-DD-YYYY')// exclusive, meaning startDate >= date > endDate
      })
      .end((err, res) => {
        res.should.have.status(406);
        done();
      });
  });
  it('endDate <= StartDate', (done) => {
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate: new Date().toISOString(), // exclusive, meaning startDate >= date > endDate
        endDate: moment().subtract(10, 'days').toDate().toISOString()
      })
      .end((err, res) => {
        res.should.have.status(406);
        done();
      });
  });
  it("currency don't exist", (done) => {
    chai.request(app).get('/currency/exchange/historical/Dummy')
      .query({
        startDate: moment().subtract(10, 'days').toDate().toISOString(), // exclusive, meaning startDate >= date > endDate
        endDate: new Date().toISOString()
      })
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
