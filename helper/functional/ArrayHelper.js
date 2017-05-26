'use strict';

/**
 * @module Helper
 */

/**
 * @class
 * @memberOf module:Helper
 * */
class ArrayHelper {
  /**
   * Will chunk array to specific size
   * @function
   * @example
   * let source = [1,2,3,4,5,6,7,8,9,10];
   * arrayChuck(source,2);
   * [[1,2],[3,4],[5,6],[7,8],[9,10]]
   * @param {Array} arrayToChunk - array need to chunk
   * @param {Number} chunkSize - array chunk size
   * @return {Array<Array>}
   * **/
  static arrayChunk (arrayToChunk, chunkSize) {
    let start = 0;
    let end = chunkSize;
    let chunks = [];
    let resultArrayIsNotEqualSized = arrayToChunk.length % chunkSize !== 0;
    let chunksLength = arrayToChunk.length / chunkSize;
    if (resultArrayIsNotEqualSized) {
      chunksLength = Math.floor(chunksLength) + 1;
    }
    for (let i = 0; i < chunksLength; i++) {
      start = i * chunkSize;
      end = start + chunkSize;
      chunks.push(arrayToChunk.slice(start, end));
    }
    return chunks;
  }
}

module.exports = ArrayHelper;
