'use strict';

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const logger = require('../../logger');

const AWSHelper = require('./AWSHelper');

/**
 * @class
 * @memberOf module:AWSHelper
 **/
class DynamoDBHelper {
  /**
   * Will decode page token to Object
   * @static
   * @function
   * @memberOf module:AWSHelper
   * @param {Object} pageToken - Page token that response from previous response.
   * @return {Object}
   * */
  static exclusiveStartKeyFromPageToken (pageToken) {
    if (pageToken) {
      return JSON.parse(Buffer.from(pageToken, 'base64').toString('ascii'));
    }
  }

  /**
   * Will convert dynamoDB responded last scan pointer to base64 encoded string
   * @static
   * @function
   * @memberOf module:AWSHelper
   * @param {Object} lastEvaluatedKey - DynamoDB response LastEvaluatedKey.
   * @return {String}
   * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchWriteItem-property}
   * */

  static pageTokenFromLastEvaluatedKey (lastEvaluatedKey) {
    return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
  }
  /**
   * Wrapper function dynamodb.batchWriteItem. added auto retry unprocessedItems attribute
   * @static
   * @function
   * @memberOf module:AWSHelper
   * @param {Array<Object>} requestItems - Array of items you want put to DynamoDB, size of array can't more than 25
   * @return {Promise}
   * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchWriteItem-property}
   * */

  static batchWriteItemWillRetryUnprocessedItems (requestItems) {
    let batchWriteParams = {
      RequestItems: requestItems
    };
    return new Promise((resolve, reject) => {
      AWSHelper.awsAPIRetry(dynamodb.batchWriteItem.bind(dynamodb))(batchWriteParams).then((data) => {
        if (Object.keys(data.UnprocessedItems).length > 0) {
          logger.error({item: data.UnprocessedItems}, 'Some item is unable submit to DynamoDB and will retry until success');
          return DynamoDBHelper.batchWriteItemWillRetryUnprocessedItems(data.UnprocessedItems)
            .then(resolve)
            .catch(reject);
        } else {
          logger.debug('Successfully writing to Dynamo DB');
          resolve(data);
        }
      }).catch(reject);
    });
  }
}

module.exports = DynamoDBHelper;