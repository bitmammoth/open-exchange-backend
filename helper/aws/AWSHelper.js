'use strict';



const logger = require('../../logger');

/**
 * @class AWSHelper
 * @memberOf module:AWSHelper
 * */
class AWSHelper {
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
              logger.debug({err: err, retryAfter: retryAfterMS}, `AWS API call fail but it can retry after ${retryAfterMS / 1000.0}s`);
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
              logger.error({err: err}, 'AWS call meeting unrecoverable error');
              reject(err);
            }
          });
      });
    };
  }
};

module.exports = AWSHelper;
