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
    OPEN_EXCHANGE_RATE_APP_ID: process.env.OPEN_EXCHANGE_RATE_APP_ID, // openexchangerates.org APP ID
    AWS_REGION: process.env.AWS_REGION, // AWS region you want to working to
    AWS_ACCOUNT: process.env.AWS_ACCOUNT, // AWS Account ID, required if you generate AWS environment from script
    TZ: process.env.TZ, // Timezone, SYSTEM default is UTC timezone you may chose your preferred timezone
    NODE_ENV: process.env.NODE_ENV ? process.env.NODE_ENV : 'testing' // 'testing' will cause debug mode. Set it to production before deploy
  },
  format: {
    DATEINT_FORMAT: 'YYYYMMDD', // How to present date in integer format
    INPUT_DATE_FROMAT: 'YYYY-MM-DD' // How to present date in string format (ISO8601 date format)
  },
  mock: {
    DYNAMO_DB_TESTING_RESULT_SET_LIMIT: 1 // Testing mode dynamo db return record size.
  },
  aws: {
    DYNAMO_DB_TABLE_NAME: 'ExchangeRates',
    DYNAMO_DB_WRITE_BATCH_LIMIT: 25,
    S3_LAMBDA_SOURCE_CODE_BUCKET: 'dng-dev-resources',
    S3_LAMBDA_SOURCE_CODE_PATH: 'lambda-codes/open-exchange-backend/openexchange-backend-201705242802-v0.0.3.zip',
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
