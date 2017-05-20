/**
 * Created by ngkongchor on 19/5/2017.
 */

const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {

  res.jsonForSuccessResponse({message:'respond with a resource'});
});

module.exports = router;