'use strict';

/**
 * @class
 * @memberOf module:FunctionalHelper
 * */
class PromiseHelper {
  /**
   * Will make Function in lazy call instead of run immediately
   * @param {Function} functionThatWillReturnPromise
   * @return {Function}
   * @see {@link: https://stackoverflow.com/questions/41004903/why-promises-are-designed-to-be-run-immediately-inside}
   * */
  static wrapPromiseWithCallback (functionThatWillReturnPromise) {
    return (...args) => {
      return (callback) => {
        let promise = functionThatWillReturnPromise.apply({}, args);
        PromiseHelper.callbackFromPromise(promise)(callback);
      };
    };
  }
  /**
   * Promise is difficult to control execution order so i have create wrapper function that will convert promise function to old school callback format it much easy to control execution order
   * @param {Promise} promise - promise you want wrapped by callback
   * @return {Function}
   * @see {@link: https://stackoverflow.com/questions/41004903/why-promises-are-designed-to-be-run-immediately-inside}
   * */
  static callbackFromPromise (promise) {
    return (callback) => {
      promise
        .then((data) => callback(null, data))
        .catch((err) => callback(err));
    };
  }
}

module.exports = PromiseHelper;
