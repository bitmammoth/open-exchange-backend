/**
 * Created by DavidNg on 15/5/2017.
 */
"use strict";

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require("chai-as-promised");

const app = require('../app');
const should = chai.should();
const moment = require('moment');
const mocha = require('mocha');

const importOpenExchangeRate = require('../script/cron/importOpenExchangeRate');

chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('Testing Response Structure', () => {
  it('Should Error', (done)=>{
    chai.request(app).get('/404-page-not-found').end(
      (err, res)=>{
        res.body.success.should.be.eql(false);
        done();
      }
    )
  });
  it('Should Success', (done)=>{
    chai.request(app).get('/').end(
      (err, res)=>{
        res.body.success.should.be.eql(true);
        done();
      }
    )
  });
});

describe('Testing Currency API', () => {
  it('Should base on USD return exchange rate on passed 10 days', (done)=>{
    chai.request(app).get('/currency/exchange/historical/USD')
      .query({
        startDate:moment().subtract(10,'days').format('YYYY-MM-DD'),
        endDate:moment().format('YYYY-MM-DD'),//exclusive, meaning startDate >= date > endDate
      })
      .end((err, res)=>{
        res.body.data.should.have.property('rates');
        res.body.data.rates.should.have.property(res.body.data.from);
        done();
      }
    )
  });
  it('Should base on USD return exchange rate on least import date', (done)=>{
    chai.request(app).get('/currency/exchange/least/USD')
      .end((err, res)=>{
          res.body.data.rates.should.have.property(res.body.data.from);
          done();
        }
      )
  });

  it('Should base on USD return relative value of HKD on passed 10 days', (done)=>{
    chai.request(app).get('/currency/convert/historical/USD/to/HKD')
      .query({
        amount:10.0,
        startDate:moment().subtract(10,'days').format('YYYY-MM-DD'),
        endDate:moment().format('YYYY-MM-DD')
      })
      .end((err, res)=>{
          res.body.data.rates.should.have.property(res.body.data.from);
          done();
        }
      )
  });

  it('Should base on USD return relative value of HKD on least import date', (done)=>{
    chai.request(app).get('/currency/convert/least/USD/to/HKD')
      .query({
        amount:10.0
      })
      .end((err, res)=>{
          res.body.data.rates.should.have.property(res.body.data.from);
          done();
        }
      )
  });
});

describe('Test Open Exchange Rate API', ()=>{
  it('Should import open exchange rate of yesterday to DB', ()=>{
    return importOpenExchangeRate.importOpenExchangeRateOfDate(
      moment().subtract(1,'days').toDate()
    ).should.be.fulfilled;
  }).timeout(5 * 60 * 1000);//5 mins

  it('Should import open exchange rate from passed 2 days to DB', ()=>{
    return importOpenExchangeRate.importOpenExchangeRateOfDateRange(
      moment().subtract(2,'days').format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD')
    ).should.be.fulfilled;
  }).timeout(5 * 60 * 1000);//5 mins
});