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
        console.log(category_names[1]);

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

/* router.get("/list", async (req, res) => {
  try{
    
    let query = " SELECT * FROM  tbl_products";
    connection.query(query, function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{

          let row_meta = UtilitiesHelper._convertArray(rows);
         for (const [key, value] of Object.entries(row_meta)) {
            let add_value = { category_name : 'drinks' };
            row_meta[key] = {...row_meta[key], ...add_value }
         }
         //console.log(row_meta);
          res.send(JSON.stringify(row_meta));
        }
    });

  }catch( err ){
    res.status(400).send(err);
  } 

});
 */

/* 
router.get("/get/:ids", async (req, res) => {

  ids = req.params.ids;
  try{
    
    connection.query("SELECT * FROM tbl_products WHERE id IN ("+ids+")", function(
      err,
      rows,
      fields
    ) {
        if (err){
          res.status(500).send(err);
        }else{
          res.send(JSON.stringify(rows));
        }
       
    });

  }catch( err ){
    res.status(400).send(err);
  }  
  
});*/

module.exports = router;
