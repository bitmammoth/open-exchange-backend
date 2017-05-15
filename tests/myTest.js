/**
 * Created by DavidNg on 15/5/2017.
 */
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../app');
let should = chai.should();

let moment = require('moment');

let importOpenExchangeRate = require('../bin/importOpenExchangeRate');

chai.use(chaiHttp);

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
    importOpenExchangeRate(
      moment().subtract(10, 'days'),
      moment()
    );
  });
});