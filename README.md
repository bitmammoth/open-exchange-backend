## Table of content

-[Installation](#installation)

-[Default Configuration](#default-aws-configuration)

-[Notable change comparing to template generate from express-generator](#notable-change)

-[Environment options](#node_env-options)

-[Development Practice](#development-practice)

-[Directory structure](#directory-structure)

-[System Error code](#error-code)

-[Reference](#reference)



## Installation

Before installation please ensure your local machine has been install and configured aws cli

[AWS cli installation](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)

[AWS cli configuration](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

Noted that your aws account should have AdminAccess if you want automated init aws environment by script. 

For better logging you may set NODE_ENV to development/debugging in environment variable

```
1. npm install
2. copy config/.env.example into config/.env and fill in the blank.
3. execute script/enviroment/aws-init if you don't create AWS enviroment
4. npm start
5. You can access localhost:3000 
```

## Default aws configuration

```
```

## Notable change
    1. /bin renamed to /scripts
    2. /routes renamed to /controllers

## Directory structure
    /config - Config file must placed here and read from program though index.js
    /controllers - All API call entry point 
    /error - Custom Error
    /helper - Helper function for sortcut/encystation third party usage/workflow control. Should not have any business logic here. 
    /logger 
    /middleware - Custom Express middleware. 
    /model - Data model for mapping API response / DB record / Method Request
        /db - Mapping to Dyanmo DB record
        /service - Mapping for controller access 
    /script - Script that can directly execute in base shell
        /cron - Scheuled jobs
        /enviroment - Enviroment setup
        /server
            www.js - Start node js server in localhost:3000
    /service - Logic for controller such as access db, invoke third party API ..etc.
        /exchangrate - API logic of exhcnage rate
        /conversionrate - API logic of conversion rate
        /thirdparty - Logic for commiucate to open-exchange-rate
    /repository - Logic for commiucate between Appllication data and DB data

## NODE_ENV options
1. testing
2. development
3. production

## Development Practice 

**Coding style guideline** 
* Follow and use eslint to write code
* Code coverage target : 90% (Stmets)
* Develop in strict mode by add "use strict" to beginning of JS file
* Inherits NotableError if you want error will logged into log file.
* Function never more than 3 parameters
* Line of function should less than 20
* Use static class instead of normal function if you know functions can grouping together
* No more than one classes export from module
* Use promise as much as possible instand of callback
* Never use boolean flag parameter
* Optional/Object parameter should be avoid
* JSDoc typedef always bottom of document
* Place thirdparty code under helper directory as much as possible
* Hardcoded value should in config/index.js
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

* After deployment you must manually update script/enviroment/constructAWS.js S3_LAMBDA_SOURCE_CODE_PATH variable


## Error code
0 ~ 200 Validation Error - Meaning input value is not passed validator 
201 AlreadyExistError - Meaning action can't be done beacuse resource asking to create is already exist


## Reference

[Writing middleware for use in Express apps](https://expressjs.com/en/guide/writing-middleware.html)

[Express validator middleware options check for customValidator example ](https://github.com/ctavan/express-validator#middleware-options)