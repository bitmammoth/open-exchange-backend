'use strict';

/**
 * @module DateHelper
 */

const moment = require('moment');

const config = require('../../config');
/**
 * @class
 * @memberOf module:DateHelper
 * */
class DateHelper {
  /**
   * Will convert dateInt to date
   * @static
   * @function
   * @memberOf module:DateHelper
   * @param {DateInt} dateInt
   * @return {Moment}
   * */
  static dateIntToDate (dateInt) {
    return moment(dateInt, config.format.DATEINT_FORMAT);
  }

  /**
   * Will convert moment to dateint
   * @static
   * @function
   * @memberOf module:DateHelper
   * @param {Moment} date
   * @return {DateInt}
   * */
  static dateToDateInt (date) {
    return moment(date).format(config.format.DATEINT_FORMAT);
  }

  /**
   * @static
   * @function
   * @memberOf module:DateHelper
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
