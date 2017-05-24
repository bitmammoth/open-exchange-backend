## Table of content

-[Installation](#installation)

-[Notable change comparing to template generate from express-generator](#notable-change)

-[Development Practice](#development-practice)


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

## Development Practice 

    0. Follow and use eslint to write code
    1. Alway use single quote for string (Use 'string here' instand of "string here")
    2. Use promise as much as possible instand of callback
    3. Alway develop in strict mode by add "use strict" to beginning of JS file
    4. Space after :, correct: {a: 2} , inorrect: {a:2} 
    5. Function never more than 3 parameters
    6. Never use boolean flag parameter
    7. No useless comments
    8. After deployment you must manually update script/enviroment/aws-init.js LAMBDA_SOURCE_CODE_PATH variable
    9. Indention level and length of chain should less as much as possible, maximum level must less than 3 
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
    10. Object key no quote unless necessary 
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
     11. Module import should follow that order: build-in, third-party, custom and between each type of module should have 1 empty line break
        Correct:
          require('path')
          
          require('express')
          
          require('./app')
          
            