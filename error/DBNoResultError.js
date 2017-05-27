'use strict';

const NotableError = require('./NotableError');

/**
 * Sub class of that will appear in system log with error level
 * @class
 * @memberOf module:Error
 * */
class DBNoResultError extends NotableError {
  constructor () {
    super('Requested resource not found');
    this.code = 202;
    this.status = 404; // 404 stand for Result not found
  }
}

module.exports = DBNoResultError;
