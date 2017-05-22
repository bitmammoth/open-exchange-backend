/**
 * Created by ngkongchor on 21/5/2017.
 */
"use strict";

const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const AWS = require('aws-sdk');

AWS.config.update({region: process.env.AWS_REGION});

module.exports = {
  env: {
    "OPEN_EXCHANGE_RATE_APP_ID": process.env.OPEN_EXCHANGE_RATE_APP_ID,
    "AWS_REGION": process.env.AWS_REGION,
    "AWS_ACCOUNT": process.env.AWS_ACCOUNT
  }
};