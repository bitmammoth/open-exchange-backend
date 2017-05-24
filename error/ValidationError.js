'use strict';

/**
 * Created by davidng on 5/25/17.
 */
const util = require('util');

const BaseRrror = require('./BaseError');

module.exports = class ValidationError extends BaseRrror {
  constructor (validateErrors) {
    super(util.inspect(validateErrors));
    this.code = 0;
    this.status = 400;
  }

  set code (code) {
    this._code = code + 0;
  }
};
