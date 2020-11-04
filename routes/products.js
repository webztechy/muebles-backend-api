var express = require("express");
const connection = require('../model/connection');
var utilities  = require('../helpers/utilities').Utilities;
var async = require("async");
var router = express.Router();

var UtilitiesHelper = new utilities();


router.get("/list", async (req, res) => {

  async.parallel({

    category_names: function(callback) {
      connection.query("SELECT * FROM tbl_categories WHERE meta_key IN ('name') ", function(
        err, rows, fields
      ) {
          if (err){
            callback(null, new Array() );
          }else{

            let row_meta = UtilitiesHelper._convertArray(rows);
            callback(null, row_meta);
          }
      });

    }

  }, function(err, results) {
      try{

        let category_names = results.category_names;
        //console.log(category_names[1]);

        let query = " SELECT * FROM  tbl_products";
        connection.query(query, function( err,  rows, fields) {
            if (err){
              res.status(500).send(err);
            }else{
    
              let row_meta = UtilitiesHelper._convertArray(rows);
              for (const [key, value] of Object.entries(row_meta)) {
                  const category_id = value.category_id;
                  let add_value = { category_name : '' };

                  if (category_names.hasOwnProperty(category_id)) {
                    add_value = { category_name : category_names[category_id].name };
                  }

                  row_meta[key] = {...row_meta[key], ...add_value }
              }

              res.send(JSON.stringify(row_meta));
            }
        });
    
      }catch( err ){
        res.status(400).send(err);
      } 
  });

});



router.post('/add',function(req, res){

  const meta_data = req.body;

  async.parallel({
      new_id: function(callback) {
        connection.query("SELECT (max(group_id) + 1) as id FROM `tbl_products` ORDER BY group_id DESC", function(
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
            query_update += " INSERT INTO tbl_products (group_id, meta_key, meta_value) VALUES ('"+group_id_new+"', '"+key+"', '"+value+"'); ";
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
      query_update += " UPDATE tbl_products SET meta_value = '"+value+"' WHERE meta_key LIKE '"+key+"' AND  group_id = '"+group_id+"'; ";
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


router.get("/deleteById/:ids", async (req, res) => {

  ids = req.params.ids;
  try{

    connection.query("DELETE  FROM tbl_products WHERE group_id IN ("+ids+")", function(err, rows, fields) {
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
    connection.query("SELECT * FROM tbl_products WHERE group_id IN ("+ids+")", function(
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

module.exports = router;
