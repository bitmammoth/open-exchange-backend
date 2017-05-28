'use strict';
const async = require('async');

/**
 * @class
 * @memberOf module:FunctionalHelper
 * */
class ASyncHelper {
  /**
   * Will execute async functions step by step.
   * @param {Array<Function>} callbacks
   * @return {Promise}
   * */
  static series (callbacks) {
    return new Promise((resolve, reject) => {
      async.series(callbacks, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }
}

module.exports = ASyncHelper;
