'use strict';

/**
 * @module GraphQLModel
 */

const { buildSchema } = require('graphql');

let schema = buildSchema(`
  type Query {
    historicalExchangeRate(dateRange: DateRange, baseCurrency: String, pageToken: String): ExchangeRateCollection
    leastExchangeRate(baseCurrency: String): ExchangeRateCollection
    historicalConversionRate(dateRange: DateRange, currencyConvert: CurrencyConvert, pageToken: String): ConversionRateCollection
    leastConversionRate(currencyConvert: CurrencyConvert): ConversionRateCollection
  }
  
  type ExchangeRateCollection {
    base: String 
    from: String
    to: String
    rates: [ExchangeRate]
    next_page_token: String
  }
  
  type ExchangeRate {
    date: String,
    rate: String,
    currency: String
  }
  
  type ConversionRateCollection {
    base: String 
    targetCurrency: String
    baseAmount: Float
    from: String
    to: String
    rates: [ExchangeRate]
    next_page_token: String
  }
  
  input DateRange {
    startDate: String
    endDate: String
  }
  
  input CurrencyConvert {
    from: String
    to: String
    amount:Float
  }
`);

module.exports = schema;
