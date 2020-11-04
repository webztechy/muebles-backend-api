var express = require("express");
const connection = require('../model/connection');
var utilities  = require('../helpers/utilities').Utilities;
var async = require("async");
var router = express.Router();

var UtilitiesHelper = new utilities();

router.post('/add',function(req, res){

  const meta_data = req.body;

  async.parallel({
      new_id: function(callback) {
        connection.query("SELECT (max(group_id) + 1) as id FROM `tbl_categories` ORDER BY group_id DESC", function(
          err, rows, fields
        ) {
            if (err){
              callback(null, 0);
            }else{
              let latest_id = rows[0].id;
              if ( latest_id === null){
                  latest_id = 1;
              }
              callback(null, latest_id);
            }
        });

      }/* ,
      two: function(callback) {
        callback(null, 'xyz\n');
      } */

  }, function(err, results) {

      if (err) throw err;

      if (parseInt(results.new_id)>0){
        const group_id_new = parseInt(results.new_id);

        let query_update = '';
        for (const [key, value] of Object.entries(meta_data)) {
          if (key!='id'){
            query_update += " INSERT INTO tbl_categories (group_id, meta_key, meta_value) VALUES ('"+group_id_new+"', '"+key+"', '"+value+"'); ";
          }
        } 

        connection.query(query_update, function(err, rows, fields) {
          if (err){
            var returns = { status : 0 }
            res.status(400).send(JSON.stringify(returns));
          }else{
            var returns = { status : 1 }
            res.status(200).send(JSON.stringify(returns));
          }
        }); 
      }
  });

});



router.post('/update',function(req, res){

  const meta_data = req.body;
  const group_id = parseInt(meta_data.id);

  let query_update = '';
  for (const [key, value] of Object.entries(meta_data)) {
    if (key!='id'){
      query_update += " UPDATE tbl_categories SET meta_value = '"+value+"' WHERE meta_key LIKE '"+key+"' AND  group_id = '"+group_id+"'; ";
    }
    
  }
  connection.query(query_update, function(err, rows, fields) {
    if (err){
      var returns = { status : 0 }
      res.status(400).send(JSON.stringify(returns));
    }else{
      var returns = { status : 1 }
      res.status(200).send(JSON.stringify(returns));
    }
  });   
  
});


router.get("/list/:status", async (req, res) => {
  status = req.params.status;
  try{
    
    let query = " SELECT group_id FROM tbl_categories WHERE meta_key IN ('status') AND meta_value IN ("+status+") ";
    query =  " SELECT * FROM tbl_categories WHERE group_id IN ("+query+") ";

    connection.query(query, function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{

          let row_meta = UtilitiesHelper._convertArray(rows);
          res.send(JSON.stringify(row_meta));
        }
    });

  }catch( err ){
    res.status(400).send(err);
  } 

});


router.get("/list", async (req, res) => {

  try{
    
    let query = " SELECT * FROM tbl_categories ";
    connection.query(query, function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{

          let row_meta = UtilitiesHelper._convertArray(rows);
          res.send(JSON.stringify(row_meta));
        }
    });

  }catch( err ){
    res.status(400).send(err);
  } 

});


router.get("/deleteById/:ids", async (req, res) => {

  ids = req.params.ids;
  try{

    connection.query("DELETE  FROM tbl_categories WHERE group_id IN ("+ids+")", function(err, rows, fields) {
      if (err){
        var returns = { status : 0 }
        res.status(400).send(JSON.stringify(returns));
      }else{
        var returns = { status : 1 }
        res.status(200).send(JSON.stringify(returns));
      }
    }); 

  }catch( err ){
    res.status(400).send(err);
  } 

});

router.get("/getById/:ids", async (req, res) => {

  ids = req.params.ids;
  try{
    //console.log("SELECT * FROM tbl_categories WHERE group_id IN ("+ids+")");
    connection.query("SELECT * FROM tbl_categories WHERE group_id IN ("+ids+")", function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{
          let row_meta = UtilitiesHelper._convertArray(rows);
          res.status(200).send(JSON.stringify(row_meta));
        }
       
    });

  }catch( err ){
    res.status(400).send(err);
  } 

});
  
router.get("/getTotal", async (req, res) => {

  ids = req.params.ids;
  try{
    
    connection.query("SELECT COUNT(*) as total FROM `tbl_categories` WHERE meta_key IN ('name')", function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{
          let result = rows.shift();
          res.status(200).send(JSON.stringify(result));
        }
       
    });

  }catch( err ){
    res.status(400).send(err);
  } 
});

module.exports = router;
