'use strict';
const path = require('path');

const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const expressValidator = require('express-validator');

require('./config');
const controllers = require('./controller');
const middleware = require('./middleware');
const app = express();

const customResponse = middleware.customResponse;

// view engine setup
app.set('view', path.join(__dirname, 'view'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// According to model README it must immediately after bodyParser, https://github.com/ctavan/express-validator#installation
// For available options you can check https://github.com/ctavan/express-validator#middleware-options
app.use(expressValidator([]));
app.use(cookieParser());
app.use(customResponse.json);

// TODO: How to make better dummy api for test?
app.use('^/$', (req, res)=> {
  res.jsonForSuccessResponse({});
});
app.use('/currency', controllers.currencyExchange);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.jsonForFailureResponse(err);
});

module.exports = app;
