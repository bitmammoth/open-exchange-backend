'use strict';

/**
 * @module Helper
 */
const moment = require('moment');

const config = require('../../config');
/**
 * @class
 * @memberOf module:Helper
 * */
class DateHelper {
  /**
   * Will convert dateInt to date
   * @static
   * @param {DateInt} dateInt
   * @return {Moment}
   * */
  static dateIntToDate (dateInt) {
    return moment(dateInt, config.format.DATEINT_FORMAT);
  }

  /**
   * Will convert moment to dateint
   * @static
   * @param {Moment} date
   * @return {DateInt}
   * */
  static dateToDateInt (date) {
    return moment(date).format(config.format.DATEINT_FORMAT);
  }

  /**
   * @static
   * @return {Moment}
   * */
  static now () {
    return moment();
  }
}

module.exports = DateHelper;

/**
 * @typedef DateInt
 * @type {String|Number}
 * @description YYYYMMDD
 * */
