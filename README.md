## General table of content

-[Description](#description)

-[Solution architecture](#solution-architecture)

-[Framework/Service](#selected-framework-and-service)

-[Production link](#production-link)

-[Technical detail](#technical-details)

## Description

This system is designed for download exchange-rate from [openexchangerates.org](https://openexchangerates.org) which is service 
that will provide hourly updated exchange rate of currency that based on USD for free account. 

Our system will on top on USD base rate provide another based rate (Base on JPY, HKD for example)

## Solution architecture
How serverless application work

![Backend architecture](https://s3-ap-northeast-1.amazonaws.com/open-doc/open-exchange-backend/images/exchange-rate-challenge-backend-arch.jpg)

I have selected AWS serverless architecture as system based.

AWS serverless can provide following benefit:
* All choice is self-managed service that mean i can just force how to implement my logic instead of how to configure server
* Out of box provide auto scaling, logging, monitoring

With below limitation:
* Each request maximum execution time is [5 minutes](http://docs.aws.amazon.com/lambda/latest/dg/limits.html)
* Implementation must stateless that mean session is not working on AWS serverless

## Selected framework and service
* [Dynamo db](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) - Strong type NoSQL DB engine. it provide fast, auto scaling for reading data from it.
* [Bunyan](https://github.com/trentm/node-bunyan) - Logger that output is json format it provide machine readable format for log analysis
* [Express](http://expressjs.com) - Express web framework is first class support by [AWS](https://github.com/awslabs/aws-serverless-express)
* [istanbul](https://istanbul.js.org) - Code coverage analytics tools of javascript. it provide the hints for statement is covered by test case or not
* [eslint](http://eslint.org) - Code styling check tool on javascript. it is provide flexible config and will keep code style consistency


## Production link

Only support Chrome
[Simple front end demo](https://d1pi9murur51x7.cloudfront.net/convert/historical)

[Backend API endpoint](https://8m3unj9isf.execute-api.ap-northeast-1.amazonaws.com/test)

## Technical Details

-[Installation](#installation)

-[Default Configuration](#default-aws-configuration)

-[Notable change comparing to template generate from express-generator](#notable-change)

-[Configurable](#configable-options)

-[Directory structure](#directory-structure)

-[Development Practice](#development-practice)

-[System Error code](#error-code)

-[Documentation](#documentation)

-[Reference](#reference)


## Installation

Before installation please ensure your local machine has been install and configured aws cli

[AWS cli installation](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)

[AWS cli configuration](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

Noted that your aws account should have AdminAccess if you want automated init aws environment by script. 

```
1. npm install
2. copy config/.env.example into config/.env and fill in the blank.
3. execute script/enviroment/aws-init if you don't create AWS enviroment
4. npm start
5. You can access localhost:3000 
```

If you want edit API document written in [API Blueprint](https://apiblueprint.org)
You can install (apiary-client)[https://github.com/apiaryio/apiary-client] by
```
gem install apiaryio
```

## Default aws configuration

Noticed that you will need create your own S3 bucket inorder to hold the lambda source code. for configuration see [Configurable](#configable-options)

```
IAM used by Lambda:
    Role: intranet
    Access : AdministratorAccess
DynamoDB: 
    Table: 
        ExchangeRates
        Primary Key: RateBase
        Secound Sort Key: RateDate
Lambda Function:
    currencyExchangeBackend
    downloadOpenExchangeRate
API Gate Way:
    API: Currency exchange backend
    Path: /{proxy+}
    Method: ANY, OPTIONS
CloudWatch Events:
    Scheulers : 0 20 ? * * * 
```

## Notable change
    1. /bin renamed to /scripts
    2. /routes renamed to /controllers
    
## Configurable options
You can check conifg/index.js for that 
```
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
    S3_LAMBDA_SOURCE_CODE_BUCKET: '<Manually change here for your first deployment, it is your S3 bucket for store lambda code>',
    S3_LAMBDA_SOURCE_CODE_PATH: 'Manually change here for your first deployment, it is your S3 path for store lambda code',
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
    }
)}
```

## Directory structure
**Relationship between controller, service and repository**
![Relationship between controller, service and repository](https://s3-ap-northeast-1.amazonaws.com/open-doc/open-exchange-backend/images/package-relationship-backend.jpg)

**Directory overview**

    /config - Config file must placed here and read from program though AWSHelper.js
    /controllers - All API call entry point 
    /error - Custom Error
    /helper - Helper function for sortcut/encystation third party usage/workflow control. Should not have any business logic here. 
        /aws
        /date
        /functional - Logic/Functional shortcut such as Array, Promise ..etc.
        /validation
    /logger -- logging config
    /middleware - Custom Express middleware.
        /response - Will provide function for handle about err/response formatting . 
        /validation - Will provide middleware for validation
    /model - Data model for mapping API response / DB record / Method Request
        /db - Mapping to Dyanmo DB record
        /service - Mapping for controller access 
    /repository - Logic for commiucate between Appllication data and DB data
    /script - Script that can directly execute in base shell
        /cron - Scheuled jobs
        /enviroment - Enviroment setup
        /server
            www.js - Start node js server in localhost:3000
    /service - Logic for controller such as access db, invoke third party API ..etc.
        /exchangrate - API logic of exhcnage rate
        /conversionrate - API logic of conversion rate
        /thirdparty - Logic for commiucate to open-exchange-rate
    /test
    .eslintrc.js - ESlint config
    apiary.apib - API Blueprint
    app.js - Express JS setup
    lambda.js - Serverless express intergration
    lambdaCron.js - Lambda Cronjob intergration

## Development Practice 

**Coding style guideline** 
* Follow and use eslint write code
* Code coverage target : 90% (Stmets)
* JS variable always naming with mixedCase (correct: fooBar,incorrect: foo_bar, foobar..etc.)
* JSON key always use _ as sep . Correct : event_timestamp Incorrect: eventTimestamp
* Develop in strict mode by add "use strict" to beginning of JS file
* Inherits NotableError if you want error will logged into log file.
* Function never more than 3 parameters
* Line of function should less than 20
* Use static class instead of normal function if you know functions can grouping together
* No more than one classes export from module
* Use promise as much as possible instand of callback
* Never use boolean flag parameter
* Optional/Object parameter should be avoid
* While module export is class. file name must be upper case
* JSDoc typedef always bottom of document
* Place third-party code under helper directory as much as possible
* Hardcoded value should in config/AWSHelper.js
* If module only has exactly one Class just create index.js and export as default
```Example:
    /repository
        /exchangerate
            index.js - If exchangerate only contain one class/module then export in index.js:
                class ExchangeRate {}
                module.exports = ExchangeRate;
   Example:
    /repository
        /exchangerate
            ConversionRate.js
            ExchangeRate.js
            index.js - If exchangerate more than one Classes then in index.js:
                const ConversionRate = require('./ConversionRate');
                const ExchangeRate = require('./ExchangeRate');
                module.exports.ExchangeRate = ExchangeRate;
                module.exports.ConversionRate = ConversionRate;
```
* No useless comments
```
    Example useless comments:
    /**
    * Will return a+b 
    */
    function sum(a,b){
      return a+b;
    }
```
* Indention level and length of chain should less as much as possible, maximum level must less than 3 
```
Correct:
    if (foo){
      //Indention level 1
    }
    if (foo){
      if (bar){
        //Indention level 2
      }
    }
    Promise(foo)
      .then(bar) //Chain size is 1
    Promise(foo)
      .then(bar)
      .then(foobar) //Chain size is 2
Incorrect:
    if (foo){
      if (bar){
        if (foobar){
          //Indention level 3
        }
      }
    }
    Promise(foo)
      .then(bar)
      .then(foobar)
      .then(foo) //Chain size is 3
```
* Object key no quote unless necessary 
```
        Correct:
          {
            a : 1,
            b: 2
          }
        Incorrect:
          {
            'a': 1,
            'b': 2
          }
```
* Module import should follow that order: build-in, third-party, custom and between each type of module should have 1 empty line break
```
Correct:
    require('path')
          
    require('express')
          
    require('./app')
```          

* Module export is class than use upper in file name. 
```
Correct:
    BaseError.js:
        modules.export = class BaseError{}
```

* ')' in end of line should not more than 2.
```
Correct:
    console.log(foo());
Incorrect:
    console.log(foo(bar()));
```

**Deployment guideline**
* After deployment you must manually update conifg/index.js S3_LAMBDA_SOURCE_CODE_PATH variable
* Before deployment you should execute ```npm test``` for check code coverage
* If code coverage < 90% then you should written test case for meet the target
* For create lambda deployment package see [Creating a Deployment Package (Node.js)](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html)

## Error code

**Error architecture**
![Error architecture](https://s3-ap-northeast-1.amazonaws.com/open-doc/open-exchange-backend/images/errors-architecture-backend.jpg)

    0 ~ 200 Validation Error - Meaning input value is not passed validator 

    201 AlreadyExistError - Meaning action can't be done beacuse resource asking to create is already exist

    202 DBNoResultError - Meaning DynamoDB can't lookup result according to submitted conditions

## Documentation
Class method/function/variable:  [JSDoc](https://s3-ap-northeast-1.amazonaws.com/open-doc/open-exchange-backend/jsdoc/index.html)

Public API Doc: [apiry](https://s3-ap-northeast-1.amazonaws.com/open-doc/open-exchange-backend/apiry/apiary.html)


## Reference

[Writing middleware for use in Express apps](https://expressjs.com/en/guide/writing-middleware.html)

[Express validator middleware options check for customValidator example ](https://github.com/ctavan/express-validator#middleware-options)

[Creating a Deployment Package (Node.js)](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html)

[AWS serverless express JS](https://github.com/awslabs/aws-serverless-express#is-aws-serverless-right-for-my-app)

[AWS serverless](https://aws.amazon.com/serverless/)