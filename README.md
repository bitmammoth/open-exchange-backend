## Table of content

-[Installation](#installation)

-[Notable change comparing to template generate from express-generator](#notable-change)

-[Development Practice](#development-practice)

-[Directory structure](#directory-structure)

-[System Error code](#error-code)

-[Reference](#reference)



## Installation

Before installation please ensure your local machine has been install and configured aws cli

[AWS cli installation](http://docs.aws.amazon.com/cli/latest/userguide/installing.html)

[AWS cli configuration](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

Noted that your aws account should have AdminAccess if you want automated init aws environment by script. 

```
1. npm install
2. copy config/.env.example into config/.env and fill in the blank
3. execute script/enviroment/aws-init if you don't create AWS enviroment
4. npm start
5. You can access localhost:3000 
```

## Notable change
    1. /bin renamed to /scripts
    2. /routes renamed to /controllers

## Directory structure
    /config - Config file must placed here and read from program though index.js
    /controllers - All API call entry point 
    /error - Custom Error
    /middleware - Custom Express middleware. 
    /model - Date model for mapping Third party API response / DB record
    /script - Script that can directly execute in base shell
        /cron - Scheuled jobs
        /enviroment - Enviroment setup
        /server
            www.js - Start node js server in localhost:300
    /validator - Custom validators for validate argument value

## Development Practice 

* Follow and use eslint to write code
* Use promise as much as possible instand of callback
* Develop in strict mode by add "use strict" to beginning of JS file
* Function never more than 3 parameters
* Never use boolean flag parameter
* No useless comments
* After deployment you must manually update script/enviroment/aws-init.js LAMBDA_SOURCE_CODE_PATH variable
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

## Error code
0 ~ 200 Validation Error 

## Reference

[Writing middleware for use in Express apps](https://expressjs.com/en/guide/writing-middleware.html)

[Express validator middleware options check for customValidator example ](https://github.com/ctavan/express-validator#middleware-options)