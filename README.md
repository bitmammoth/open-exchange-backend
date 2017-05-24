## Table of content

-[Installation](#installation)

-[Notable change comparing to template generate from express-generator](#notable-change)

-[Development Practice](#development-practice)


## Installation
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
    
    1. Alway use single quote for string (Use 'string here' instand of "string here")
    2. Use promise as much as possible instand of callback
    3. Alway develop in strict mode by add "use strict" to beginning of JS file
    4. Space after :, correct: {a: 2} , inorrect: {a:2} 
    5. Function never more than 3 parameters
    6. Never use boolean flag parameter
    7. No useless comments
    8. After deployment you must manually update script/enviroment/aws-init.js LAMBDA_SOURCE_CODE_PATH variable