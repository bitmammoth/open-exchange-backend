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

//TODO: Replace me!!!!!!!!!!!!!!!!!!!!!
describe('Init Testing', () => {
  it('Should 404', (done)=>{
    chai.request(app).get('/user').end(
      (err, res)=>{
        res.should.have.status(404);
        done();
      }
    )
  });
  it('Should 200', (done)=>{
    chai.request(app).get('/users').end(
      (err, res)=>{
        res.should.have.status(200);
        done();
      }
    )
  });
});

describe('Test Open Exchange Rate API', ()=>{
  it('Should import open exchange rate to DB', ()=>{
    return importOpenExchangeRate(
      yesterday()
    ).should.be.fulfilled;
  });
});

function yesterday(){
  return moment().subtract(1,'days');
}