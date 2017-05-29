'use strict';

process.env.NODE_ENV = 'testing';

require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const logger = require('../logger');
const funcationalHelper = require('../helper/functional/');
const PromiseHelper = funcationalHelper.PromiseHelper;
const AsyncHelper = funcationalHelper.AsyncHelper;

chai.should();
chai.use(chaiHttp);
chai.use(chaiAsPromised);

function promiseBeforeResolveWillSleep (second, id) {
  return new Promise((resolve, reject) => {
    logger.debug(`Promise: ${id} executing`);
    setTimeout(() => {
      logger.debug(`Promise : ${id} completed`);
      resolve(id);
    }, second * 1000);
  });
}

describe('Test PromiseHelper', () => {
  it('Should executed by order', (done) => {
    let promisesJobs = [];
    promisesJobs.push(PromiseHelper.wrapPromiseWithCallback(promiseBeforeResolveWillSleep)(8, 1));
    promisesJobs.push(PromiseHelper.wrapPromiseWithCallback(promiseBeforeResolveWillSleep)(6, 2));
    promisesJobs.push(PromiseHelper.wrapPromiseWithCallback(promiseBeforeResolveWillSleep)(4, 3));
    promisesJobs.push(PromiseHelper.wrapPromiseWithCallback(promiseBeforeResolveWillSleep)(2, 4));
    promisesJobs.push(PromiseHelper.wrapPromiseWithCallback(promiseBeforeResolveWillSleep)(0, 5));
    AsyncHelper.series(promisesJobs).then((result) => {
      result.should.deep.equal([1, 2, 3, 4, 5]);
      done();
    });
  }).timeout(30000);
});
