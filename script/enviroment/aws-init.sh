#!/usr/bin/env bash

aws dynamodb create-table --table-name ExchangeRates \
--attribute-definitions AttributeName=RateBase,AttributeType=S \
AttributeName=RateDate,AttributeType=N \
--key-schema AttributeName=RateBase,KeyType=HASH \
AttributeName=RateDate,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
