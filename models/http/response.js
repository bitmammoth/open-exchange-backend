/**
 * Created by DavidNg on 15/5/2017.
 */
class Response{
  constructor(res){
    this.res = res;
  }

  json(responseData){
    return this.res.json({
      success: this.res.statusCode < 400, //HTTP status code more than 400 meaning require fail
      data: responseData,
      response_timestamp: new Date().getTime()
    });
  }
}

module.exports = Response;