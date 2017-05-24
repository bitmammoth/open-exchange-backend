'use strict';

const moment = require('moment');

/**
 * Created by davidng on 5/25/17.
 */

module.exports.isDate = (value) => {
  let dateIsValide = moment(value, 'YYYY-MM-DDTHH:mm:ss.sssZ').isValid(); // TODO: Avoid hardcoded value
  return dateIsValide;
};
