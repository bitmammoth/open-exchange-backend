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

describe('Testing historical convert currency API', () => {
  it('base on USD return only HKD conversion rate on passed 10 days', (done) => {
    let startDate = moment().subtract(10, 'days').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'USD';
    let target = 'HKD';
    let amount = 10;
    getHistoricalCoversionRateBaseOn(base, target, startDate, endDate, amount)
      .end((err, res) => {
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      });
  });
  it('Paginated conversion rate base on HKD to JPY from YTD', (done) => {
    let startDate = moment().startOf('year').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'HKD';
    let target = 'JPY';
    let amount = 10;
    getHistoricalCoversionRateBaseOn(base,target, startDate, endDate, amount)
      .end((_err, _res) => {
        _res.body.data.should.have.property('next_page_token');
        let page2Token = _res.body.data.next_page_token; // Token required to fetch page 2.
        getHistoricalCoversionRateBaseOn(base, target,startDate, endDate, amount, page2Token)
          .end((err, res) => {
            res.body.data.should.have.property('next_page_token');
            let page3Token = res.body.data.next_page_token;// Token required to fetch page 3.
            page2Token.should.not.equal(page3Token);
            done();
          });
      });
  });
});

function getHistoricalCoversionRateBaseOn (from, to, startDate, endDate, amount, pageToken) {
  return chai.request(app).get(`/currency/convert/historical/${from}/to/${to}`)
    .query({
      amount: amount,
      startDate: startDate,
      endDate: endDate,
      pageToken: pageToken
    });
}

describe('Testing Least convert currency API', () => {
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
});

describe('Testing convert currency API Error', () => {
  it('base on HKD return only JPY conversion rate on passed 10 days', (done) => {
    chai.request(app).get('/currency/convert/historical/HKD/to/JPY')
      .query({
        amount: 10.0,
        startDate: moment().subtract(10, 'days').format('MM-DD-YYYY'),
        endDate: moment().format('MM-DD-YYYY')
      })
      .end((err, res) => {
        res.should.have.status(406);
        done();
      });
  });
  it('Amount is not number ', (done) => {
    chai.request(app).get('/currency/convert/least/USD/to/HKD')
      .query({
        amount: 'Non number string'
      })
      .end((err, res) => {
        res.should.have.status(406);
        done();
      });
  });
  it('From currency incorrect ', (done) => {
    chai.request(app).get('/currency/convert/least/Dummy/to/HKD')
      .query({
        amount: 100
      })
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
  it('To currency incorrect ', (done) => {
    chai.request(app).get('/currency/convert/least/USD/to/Dummy')
      .query({
        amount: 100
      })
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
