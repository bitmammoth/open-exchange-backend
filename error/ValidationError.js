'use strict';
/**
 * @module Error
 */

const util = require('util');

const BaseError = require('./BaseError');

/**
 * @class ValidationError
 * */
module.exports = class ValidationError extends BaseError {
  constructor (validateErrors) {
    super(util.inspect(validateErrors));
    this.code = 0;
    this.status = 400;
  }

  set code (code) {
    this._code = code + 0;
  }

};
