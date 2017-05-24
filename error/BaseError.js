'use strict';

/**
 * Created by davidng on 5/25/17.
 */

module.exports = class BaseError extends Error {
  set status (status) {
    this._status = status;
  }

  get status () {
    return this._status;
  }

  set code (code) {
    this._code = code;
  }

  get code () {
    return this._code;
  }

  set message (message) {
    this._message = message;
  }

  get message () {
    return this._status;
  }
};
