'use strict';

const util = require('util');

const NotableError = require('./NotableError');

/**
 * @class ValidationError
 * @memberOf module:Error
 * */
module.exports = class ValidationError extends NotableError {
  constructor (validateErrors) {
    super(util.inspect(validateErrors));
    this.code = 0;
    this.status = 406;
  }
};
