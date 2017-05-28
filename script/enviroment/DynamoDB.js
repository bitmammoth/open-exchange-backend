'use strict';

const AWS = require('aws-sdk');
const config = require('../../config');
const error = require('../../error');
const logger = require('../../logger');

const dynamodb = new AWS.DynamoDB();
const AWS_CONFIG = config.aws;
const AlreadyExistError = error.AlreadyExistError;

const PromiseHelper = require('../../helper/functional').PromiseHelper;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * */
class DynamoDBConstruct {
  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static construct () {
    return DynamoDBConstruct
      .shouldCreateDynamoDBTable()
      .then(DynamoDBConstruct.constructDynamoDB)
      .catch(PromiseHelper.handleError);
  }

  /**
   * Will create dynamoDB table with default ProvisionedThroughput ( read and write both 5)
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static constructDynamoDB () {
    logger.info(`Will create table ${AWS_CONFIG.DYNAMO_DB_TABLE_NAME} on DynamoDB`);
    return dynamodb.createTable({
      AttributeDefinitions: [
        {
          AttributeName: 'RateBase',
          AttributeType: 'S'
        },
        {
          AttributeName: 'RateDate',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'RateBase',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'RateDate',
          KeyType: 'RANGE'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      },
      TableName: AWS_CONFIG.DYNAMO_DB_TABLE_NAME
    }).promise();
  }

  /**
   * Will detch DyanmoDB already installed by table name
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static shouldCreateDynamoDBTable () {
    return new Promise((resolve, reject) => {
      dynamodb.describeTable({
        TableName: AWS_CONFIG.DYNAMO_DB_TABLE_NAME
      }).promise()
        .then(
          () => reject(new AlreadyExistError(`Dynamo DB Table: ${AWS_CONFIG.DYNAMO_DB_TABLE_NAME} Already exist`)),
          resolve
        );
    });
  }
}

module.exports = DynamoDBConstruct;
