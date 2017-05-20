/**
 * Created by DavidNg on 15/5/2017.
 */
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require("chai-as-promised");

const app = require('../app');
const should = chai.should();
const moment = require('moment');

const importOpenExchangeRate = require('../scripts/cron/importOpenExchangeRate');

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
  it('Should base on USD return exchange rate', (done)=>{
    chai.request(app).get('/currency/exchange/USD')
      .query({
        startDate:moment().subtract(10,'days').format('YYYY-MM-DD'),
        endDate:moment().format('YYYY-MM-DD'),//exclusive, meaning startDate >= date > endDate
        to:"HKD"
      })
      .end((err, res)=>{
        res.body.data.rates.should.have.property("20170520");
        done();
      }
    )
  });
});



describe('Test Open Exchange Rate API', ()=>{
  it('Should import open exchange rate to DB', ()=>{
    return importOpenExchangeRate(
      moment().subtract(1,'days').toDate()
    ).should.be.fulfilled;
  });
});