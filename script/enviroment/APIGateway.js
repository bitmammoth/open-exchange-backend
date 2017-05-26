'use strict';

const AWS = require('aws-sdk');
const config = require('../../config');
const LambdaConstruct = require('./Lambda');
const error = require('../../error');
const logger = require('../../logger');
const PromiseErrorHandler = require('./ErrorHandler');

const apigateway = new AWS.APIGateway();
const AWS_CONFIG = config.aws;
const AlreadyExistError = error.AlreadyExistError;

/**
 * @class
 * @memberOf module:AWSInfrastructure
 * @see {@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html}
 * */
class APIGatewayBuilder {
  /**
   * @static
   * @function
   * @memberOf module:AWSInfrastructure
   * @return {Promise}
   * */
  static construct () {
    let apiGateWay = new APIGatewayBuilder();
    return apiGateWay.shouldSetupApiGateway()
      .then(apiGateWay.registerAPIGateWay)
      .then(apiGateWay.registerResource)
      .then(apiGateWay.integrateProxyAPIAndLambda)
      .then(apiGateWay.integrateCORS)
      .then(apiGateWay.deployToStaging)
      .catch(PromiseErrorHandler.handleError);
  }

  constructor () {
    /**
     * Hold informant about created API
     * @type {Object}
     * @property {String} restApiId - RESTAPI API required for integration step
     * @property {String} resourceId - RESTAPI resource ID required for integration step
     * */
    this.rootResource = {};
    this.registerAPIGateWay = this.registerAPIGateWay.bind(this);
    this.rootResourceSourceIDOfAPI = this.rootResourceSourceIDOfAPI.bind(this);
    this.registerResource = this.registerResource.bind(this);
    this.integrateProxyAPIAndLambda = this.integrateProxyAPIAndLambda.bind(this);
    this.integrateCORS = this.integrateCORS.bind(this);
    this.enableAPITester = this.enableAPITester.bind(this);
    this.deployToStaging = this.deployToStaging.bind(this);
  }

  /**
   * Function will return APIGateway alreay constructed or not by their name
   * @return {Promise}
   * */
  shouldSetupApiGateway () {
    return new Promise((resolve, reject) => {
      return apigateway.getRestApis({
        limit: 500
      }).promise().then((data) => {
        for (let item of data.items) {
          if (item.name === AWS_CONFIG.API_GATEWAY_API_NAME) {
            reject(new AlreadyExistError('APIGateway'));
            return;
          }
        }
        resolve();
      });
    });
  }

  /**
   * Function will create API on APIGateway
   * @return {Promise}
   * */
  registerAPIGateWay () {
    return apigateway.createRestApi({
      name: AWS_CONFIG.API_GATEWAY_API_NAME,
      description: 'API for list least/historical exchange rate'
    }).promise()
      .then((data) => {
        return this.rootResourceSourceIDOfAPI(data.id);
      });
  }

  /**
   * Function will lookup root resource ('/') path id from restId
   * @param {String} restApiId - Lookup API ID
   * @return {Promise}
   * */
  rootResourceSourceIDOfAPI (restApiId) {
    return apigateway.getResources({
      restApiId: restApiId
    }).promise().then((data) => {
      let resource = data.items[0];
      this.rootResource = {
        resourceId: resource.id,
        restApiId: restApiId
      };
      return Promise.resolve(this.rootResource);
    });
  }

  /**
   * Function register necessary resource under fresh API<br/>
   * Currently will create simple proxy API and CORS purpose mock API.
   * @return {Promise}
   * */
  registerResource () {
    return apigateway.createResource({
      restApiId: this.rootResource.restApiId,
      pathPart: '{proxy+}',
      parentId: this.rootResource.resourceId
    }).promise()
      .then(() => {
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'ANY',
          resourceId: this.rootResource.resourceId,
          restApiId: this.rootResource.restApiId,
          apiKeyRequired: false,
          requestParameters: {
            'method.request.path.proxy': true
          }
        }).promise();
      })
      .then((data) => {
        // http://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
        // Set up preflight method for wbe site AJAX request
        return apigateway.putMethod({
          authorizationType: 'NONE',
          httpMethod: 'OPTIONS',
          resourceId: this.rootResource.resourceId,
          restApiId: this.rootResource.restApiId,
          apiKeyRequired: false
        }).promise();
      });
  }

  /**
   * Set up proxy api for lambda, any request will use that endpoint to communicate to lambda
   * @function
   * @return {Promise}
   * @see {@link http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html}
   * */
  integrateProxyAPIAndLambda () {
    return apigateway.putIntegration({
      httpMethod: 'ANY',
      resourceId: this.rootResource.resourceId,
      restApiId: this.rootResource.restApiId,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST', // API Gateway uses to communicate with AWS Lambda
      passthroughBehavior: 'WHEN_NO_MATCH',
      uri: `arn:aws:apigateway:${config.env.AWS_REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${config.env.AWS_REGION}:${config.env.AWS_ACCOUNT}:function:${AWS_CONFIG.LAMBDA_SERVERLESS_EXPRESS_FUNCTION_NAME}/invocations`
    }).promise()
      .then((data) => {
        return apigateway.putIntegrationResponse({
          httpMethod: 'ANY',
          resourceId: this.rootResource.resourceId,
          restApiId: this.rootResource.restApiId,
          statusCode: '200',
          contentHandling: 'CONVERT_TO_TEXT',
          responseTemplates: {
            'application/json': null
          }
        }).promise().then(() => { return Promise.resolve(data); });
      });
  }

  /**
   * Set up CORS integration so that we can use AJAX call access API
   * @function
   * @return {Promise}
   * @see {@link http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html}
   * */
  integrateCORS () {
    return apigateway.putIntegration({
      httpMethod: 'OPTIONS',
      resourceId: this.rootResource.resourceId,
      restApiId: this.rootResource.restApiId,
      type: 'MOCK',
      integrationHttpMethod: 'POST', // API Gateway uses to communicate with AWS Lambda
      requestTemplates: {
        'application/json': null
      },
      passthroughBehavior: 'WHEN_NO_MATCH'
    }).promise()
      .then(() => {
        return apigateway.putMethodResponse({
          httpMethod: 'OPTIONS',
          resourceId: this.rootResource.resourceId,
          restApiId: this.rootResource.restApiId,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Origin': true
          },
          responseModels: {
            'application/json': 'Empty'
          }
        }).promise();
      })
      .then(() => {
        return apigateway.putIntegrationResponse({
          httpMethod: 'OPTIONS',
          resourceId: this.rootResource.resourceId,
          restApiId: this.rootResource.restApiId,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
            'method.response.header.Access-Control-Allow-Methods': "'*'",
            'method.response.header.Access-Control-Allow-Origin': "'*'"
          },
          responseTemplates: {
            'application/json': null
          }
        }).promise();
      });
  }

  /**
   * Will enable API tester by add permission that allow Tester invoke their
   * @function
   * @return {Promise}
   * */
  enableAPITester () {
    return LambdaConstruct.allowExpressLambdaTriggerFromAPITester(this.rootResource.restApiId);
  }

  /**
   * Will deploy configure API to public
   * @function
   * @return {Promise}
   * */
  deployToStaging () {
    return apigateway.createDeployment({
      restApiId: this.rootResource.restApiId,
      description: 'Initialize deployment',
      stageName: 'test',
      stageDescription: 'Testing environment'
    }).promise().then((data) => {
      logger.info(`API deployed to https://${this.rootResource.restApiId}.execute-api.ap-northeast-1.amazonaws.com/test`);
      return Promise.resolve(data);
    });
  }
}

module.exports = APIGatewayBuilder;
