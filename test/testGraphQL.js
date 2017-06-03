'use strict';

process.env.NODE_ENV = 'testing';

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment');
require('mocha');

const app = require('../app');

chai.should();
chai.use(chaiHttp);
chai.use(chaiAsPromised);

describe('Testing GraphQL', () => {
  it('historical exchange rate', (done) => {
    let startDate = moment().subtract(10, 'days').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'USD';
    getHistoricalExchangeRateBaseOn(base, startDate, endDate)
      .end((err, res) => {
        res.body.data.historicalExchangeRate.should.have.property('next_page_token');
        res.body.data.historicalExchangeRate.should.have.property('rates');
        res.body.data.historicalExchangeRate.rates.length.should.above(0);
        done();
      });
  });
  it('least exchange rate', (done) => {
    let base = 'USD';
    getLeastExchangeRateBaseOn(base)
      .end((err, res) => {
        res.body.data.leastExchangeRate.should.have.property('next_page_token');
        res.body.data.leastExchangeRate.should.have.property('rates');
        res.body.data.leastExchangeRate.rates.length.should.above(0);
        done();
      });
  });
  it('historical conversion rate', (done) => {
    let startDate = moment().subtract(10, 'days').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'HKD';
    let targetCurrency = 'JPY';
    let amount = 1000;
    getHistoricalConversionRateBaseOn(base, targetCurrency, startDate, endDate, amount)
      .end((err, res) => {
        res.body.data.historicalConversionRate.should.have.property('next_page_token');
        res.body.data.historicalConversionRate.should.have.property('rates');
        res.body.data.historicalConversionRate.rates.length.should.above(0);
        done();
      });
  });
  it('least conversion rate', (done) => {
    let base = 'HKD';
    let targetCurrency = 'JPY';
    let amount = 1000;
    getLeastConversionRateBaseOn(base, targetCurrency, amount)
      .end((err, res) => {
        res.body.data.leastConversionRate.should.have.property('next_page_token');
        res.body.data.leastConversionRate.should.have.property('rates');
        res.body.data.leastConversionRate.rates.length.should.above(0);
        done();
      });
  });
});

describe('Testing GraphQL pagination', () => {
  it('historical exchange rate', (done) => {
    let startDate = moment().subtract(10, 'days').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'USD';
    getHistoricalExchangeRateBaseOn(base, startDate, endDate)
      .end((err, res) => {
        let firstPageToken = res.body.data.historicalExchangeRate.next_page_token;
        getHistoricalExchangeRateBaseOn(base, startDate, endDate, firstPageToken).end((err, res) => {
          let secondPageToken = res.body.data.historicalExchangeRate.next_page_token;
          firstPageToken.should.be.not.equal(secondPageToken);
          done();
        });
      });
  });
  it('historical conversion rate', (done) => {
    let startDate = moment().subtract(10, 'days').toDate().toISOString();
    let endDate = new Date().toISOString();
    let base = 'HKD';
    let targetCurrency = 'JPY';
    let amount = 1000;
    getHistoricalConversionRateBaseOn(base, targetCurrency, startDate, endDate, amount)
      .end((err, res) => {
        let firstPageToken = res.body.data.historicalConversionRate.next_page_token;
        getHistoricalConversionRateBaseOn(base, targetCurrency, startDate, endDate, amount, firstPageToken).end((err, res) => {
          let secondPageToken = res.body.data.historicalConversionRate.next_page_token;
          firstPageToken.should.be.not.equal(secondPageToken);
          done();
        });
      });
  });
});

/**
 * @param {String} currency
 * @param {String} startDate
 * @param {String} endDate
 * @param {String} pageToken
 * @return {Promise}
 * @see {@link http://graphql.org/graphql-js/passing-arguments/}
 * */
function getHistoricalExchangeRateBaseOn (currency, startDate, endDate, pageToken) {
  return queryGraphAPI(
    `query HistoricalExchangeRate($dateRange: DateRange, $baseCurrency: String, $pageToken: String){
        historicalExchangeRate(dateRange: $dateRange, baseCurrency: $baseCurrency, pageToken: $pageToken){
          base 
          from
          to
          rates {
            date
            rate
            currency
          }
          next_page_token
        }
    }`,
    {
      dateRange: {
        startDate: startDate,
        endDate: endDate
      },
      baseCurrency: currency,
      pageToken: pageToken
    }
  );
}

/**
 * @param {String} query - GraphQL
 * @param {Object} variables - variables supply for GraphQL
 * @return {Promise}
 * */
function queryGraphAPI (query, variables) {
  return chai.request(app).post('/graphql')
    .send({
      query: query,
      variables: variables
    });
}

/**
 * @param {String} currency
 * @return {Promise}
 * @see {@link http://graphql.org/graphql-js/passing-arguments/}
 * */
function getLeastExchangeRateBaseOn (currency) {
  return queryGraphAPI(
    `query LeastExchangeRate($baseCurrency: String){
        leastExchangeRate(baseCurrency: $baseCurrency){
          base 
          from
          to
          rates {
            date
            rate
            currency
          }
          next_page_token
        }
    }`,
    {
      baseCurrency: currency
    }
  );
}

/**
 * @param {String} baseCurrency
 * @param {String} toCurrency
 * @param {String} startDate
 * @param {String} endDate
 * @param {String} amount
 * @param {String} pageToken
 * @return {Promise}
 * @see {@link http://graphql.org/graphql-js/passing-arguments/}
 * */
function getHistoricalConversionRateBaseOn (baseCurrency, toCurrency, startDate, endDate, amount, pageToken) {
  return queryGraphAPI(
    `query HistoricalConversionRate($dateRange: DateRange, $currencyConvert: CurrencyConvert, $pageToken:String){
        historicalConversionRate(dateRange: $dateRange,  currencyConvert: $currencyConvert, pageToken:$pageToken){
          base 
          targetCurrency
          baseAmount
          from
          to
          rates {
            date
            rate
            currency
          }
          next_page_token
        }
    }`,
    {
      dateRange: {
        startDate: startDate,
        endDate: endDate
      },
      currencyConvert: {
        from: baseCurrency,
        to: toCurrency,
        amount: amount
      },
      pageToken: pageToken
    }
  );
}

/**
 * @param {String} baseCurrency
 * @param {String} toCurrency
 * @param {String} amount
 * @param {String} pageToken
 * @return {Promise}
 * @see {@link http://graphql.org/graphql-js/passing-arguments/}
 * */
function getLeastConversionRateBaseOn (baseCurrency, toCurrency, amount) {
  return queryGraphAPI(
    `query LeastConversionRate($currencyConvert: CurrencyConvert){
        leastConversionRate(currencyConvert: $currencyConvert){
          base 
          targetCurrency
          baseAmount
          from
          to
          rates {
            date
            rate
            currency
          }
          next_page_token
        }
    }`,
    {
      currencyConvert: {
        from: baseCurrency,
        to: toCurrency,
        amount: amount
      }
    }
  );
}
