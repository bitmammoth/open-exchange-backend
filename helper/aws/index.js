'use strict';

/**
 * @module AWSHelper
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const logger = require('../../logger');

/**
 * @class AWSHelper
 * */
class AWSHelper {
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
          logger.error({item: data.UnprocessedItems}, 'Some item is unable submit to DynamoDB will retry until success');
          return AWSHelper.batchWriteItemWillRetryUnprocessedItems(data.UnprocessedItems)
            .then(resolve)
            .catch(reject);
        } else {
          resolve(data);
        }
      }).catch(reject);
    });
  }
  /**
   * @static
   * @function
   * @memberOf module:AWSHelper
   * @param {Function} functionNeedIncludeRetry - AWS function will executed with infinite retry
   * @param {Number} [retryCount=0] - Number of attempt
   * @return {Promise}
   * */
  static awsAPIRetry (functionNeedIncludeRetry, retryCount = 0) {
    return (...args) => { // Will by pass to aws SDK function
      return new Promise((resolve, reject) => {
        functionNeedIncludeRetry.apply({}, args).promise()// http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/using-promises.html
          .then(resolve)
          .catch((err) => { // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Response.html#error-property
            let isErrorCanRetry = err.retryable;
            let retryAfterMS = 1000 * (retryCount + 1);
            if (err.retryDelay) {
              retryAfterMS = err.retryDelay * 1000;
            }
            if (isErrorCanRetry) {
              logger.error({err: err, refryAfter: retryAfterMS}, `AWS API call fail but it can retry after ${retryAfterMS / 1000.0}s`);
              return new Promise((resolve, reject) => {
                setTimeout(
                  () => {
                    AWSHelper.awsAPIRetry(functionNeedIncludeRetry, retryCount + 1).apply(this, args)
                      .then(resolve)
                      .catch(reject);
                  }
                  , retryAfterMS
                );
              })
                .then(resolve)
                .catch(reject);
            } else {
              logger.error({err: err});
              reject(err);
            }
          });
      });
    };
  }
};

module.exports = AWSHelper;
