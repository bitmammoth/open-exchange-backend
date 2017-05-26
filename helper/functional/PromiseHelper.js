'use strict';

const co = require('co');

/**
 * @class
 * @memberOf module:FunctionalHelper
 * */
class PromiseHelper {
  /**
   * Will execute promise as series order
   * @static
   * @function
   * @memberOf module:FunctionalHelper
   * @example
   *  const co = require('co');
   *  let s = (wait,index) => {
   *    return new Promise( (resolve, reject) => {
   *      setTimeout( () => {
   *        console.log(`${index} finish with ${wait * 1000} sec`);
   *        resolve(index);
   *      }, wait * 1000);
   *    });
   *  };
   *  seriesPromise([s(5,1),s(1,2)]).then((i)=>console.log(i));// Will [1,2]
   * @param {Array<Promise>} promiseJobs - List of job you want execute step by step
   * @return {Promise<Array>} - Array contain result of promise
   * */
  static seriesPromise (promiseJobs) {
    return co(function * () {
      let jobResults = [];
      for (let job of promiseJobs) {
        let jobResult = yield job;
        jobResults.push(jobResult);
      }
      return jobResults;
    });
  }
}

module.exports = PromiseHelper;
