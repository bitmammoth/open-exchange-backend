function getDefaultJSONResponseBody(isSuccessResponse) {
  return {
    success: isSuccessResponse,
    response_timestamp: new Date().getTime()
  };
}

module.exports.json = (req,res,next)=>{
  res.jsonForSuccessResponse = (body)=>{
    let responseJSON = getDefaultJSONResponseBody(true);
    responseJSON.data = body;
    return res.json(responseJSON);
  };
  res.jsonForFailureResponse = (error)=>{
    let responseJSON = getDefaultJSONResponseBody(false);
    responseJSON.status = error.status;
    responseJSON.code = error.code;
    responseJSON.message = error.message;
    return res.json(responseJSON);
  };
  next();
};