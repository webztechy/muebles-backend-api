var express = require("express");
const connection = require('../model/connection');
const { series, parallel }  = require("gulp");
var router = express.Router();


// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
const javascript = () => {
  // body omitted
  console.log('javascript');
}

// The `build` function is exported so it is public and can be run with the `gulp` command.
// It can also be used within the `series()` composition.
function css(cb) {
  // body omitted
  console.log('css');
  //cb(null, 'this is css');
  //cb();
}


router.get("/list", async (req, res) => {
  try{

    //exports.build = parallel(javascript, css);
    //exports.build = build;
    //exports.default = series(javascript, css);

    //let response = series(javascript, css);
    console.log(series(javascript(), css()) );

    //res.status(200).send(JSON.stringify({ 'msg' : 'success' }));

  }catch( err ){
    res.status(400).send(err);
  } 
});

module.exports = router;
