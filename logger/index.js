'use strict';

const bunyan = require('bunyan');

const config = require('../config');

const env = config.env.NODE_ENV;
let logLevel;
if (env === 'production') {
  logLevel = 'warn';
}
else if (env === 'development' || env === 'testing') {
  logLevel = 'info';
}
else if (env === 'debugging') {
  logLevel = 'debug';
}
else {
  logLevel = 'warn';
}

module.exports = bunyan.createLogger({
  level: logLevel,
  name: 'open-exchange-backend',
  stream: process.stdout
});
