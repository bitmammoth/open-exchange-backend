'use strict';

/**
 * @module GraphQLModel
 */

const { buildSchema } = require('graphql');

let schema = buildSchema(`
  type Query {
    # Will return exchange rate of currency in given date range
    historicalExchangeRate(dateRange: DateRange, baseCurrency: String, pageToken: String): ExchangeRateCollection
    # Will return exchange rate of currency in least sync job executed date
    leastExchangeRate(baseCurrency: String): ExchangeRateCollection
    # Will return conversion rate between currency in given date range
    historicalConversionRate(dateRange: DateRange, currencyConvert: CurrencyConvert, pageToken: String): ConversionRateCollection
    # Will return conversion rate between currency in given date range
    leastConversionRate(currencyConvert: CurrencyConvert): ConversionRateCollection
  }
  
  # Exchange rate result
  type ExchangeRateCollection {
    # Base currency
    base: String 
    # Start date
    from: String
    # End date
    to: String
    # List of exchange rate
    rates: [ExchangeRate]
    # Will null if no more data can be provided 
    next_page_token: String
  }
  
  # Exchange rate by day
  type ExchangeRate {
    # Exchange rate effected date
    date: String,
    rate: String,
    currency: String
  }
  
  # Conversion rate result
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
