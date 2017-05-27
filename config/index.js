'use strict';

const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});
const AWS = require('aws-sdk');

AWS.config.update({region: process.env.AWS_REGION});
const IAM_ROLE_NAME = 'intranet';

module.exports = Object.freeze({
  env: {
    OPEN_EXCHANGE_RATE_APP_ID: process.env.OPEN_EXCHANGE_RATE_APP_ID,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCOUNT: process.env.AWS_ACCOUNT,
    TZ: process.env.TZ,
    NODE_ENV: process.env.NODE_ENV ? process.env.NODE_ENV : 'testing'
  },
  format: {
    DATEINT_FORMAT: 'YYYYMMDD',
    INPUT_DATE_FROMAT: 'YYYY-MM-DD'
  },
  mock: {
    DYNAMO_DB_TESTING_RESULT_SET_LIMIT: 1
  },
  aws: {
    DYNAMO_DB_TABLE_NAME: 'ExchangeRates',
    DYNAMO_DB_WRITE_BATCH_LIMIT: 25,
    S3_LAMBDA_SOURCE_CODE_BUCKET: 'dng-dev-resources',
    S3_LAMBDA_SOURCE_CODE_PATH: 'lambda-codes/open-exchange-backend/openexchange-backend-2017052404-v0.0.2.zip',
    LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME: 'currencyExchangeBackend',
    LAMBDA_DOWNLOAD_EXCHANGE_RATE_CRON_JOB_NAME: 'downloadOpenExchangeRate',
    API_GATEWAY_API_NAME: 'Currency exchange backend',
    CLOUD_WATCH_NIGHT_JOB_SCHEDULER_NAME: 'night_jobs',
    IAM_ROLE_NAME: IAM_ROLE_NAME,
    IAM_ROLE_ARN: `arn:aws:iam::${process.env.AWS_ACCOUNT}:role/${IAM_ROLE_NAME}`,
    /**
     * WARNING!
     * Role with this access will available to do anything under AWS environment such add/delete service, update service settings ...etc.
     * If you don't take a risk you can modify them after created by script.
     * */
    IAM_ROLE_POLICY: 'arn:aws:iam::aws:policy/AdministratorAccess',
    IAM_ROLE_TRUST_RELATIONSHIP: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        },
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    })
  }
});
