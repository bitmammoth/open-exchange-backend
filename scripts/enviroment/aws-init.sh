#!/usr/bin/env bash

aws dynamodb create-table --table-name ExchangeRates --attribute-definitions AttributeName=RateDate,AttributeType=N --key-schema AttributeName=RateDate,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
