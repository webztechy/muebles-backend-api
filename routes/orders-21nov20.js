var express = require("express");
const connection = require('../model/connection');
var utilities  = require('../helpers/utilities').Utilities;
var async = require("async");
var router = express.Router();

var UtilitiesHelper = new utilities();


router.post("/add_to_cart", async (req, res) => {

  const params_request = req.body;

  if ( params_request.hasOwnProperty('id') ) {
      
      const product_id_request = params_request['id'];

      async.waterfall([

        function(callback) {
            
            const query = " SELECT count(*) as count  FROM tbl_orders WHERE product_id IN ("+product_id_request+") ";
            connection.query(query, function(
              err, rows, fields
            ) {
                if (err){
                  callback(null, 0);
                }else{
                  callback(null, rows[0]['count'] );
                }
            }); 
        },

        function ( counter, callback ){

            counter = parseInt(counter);
            if ( counter>0 ){
                const query = " SELECT quantity  FROM tbl_orders WHERE product_id IN ("+product_id_request+") ";
                connection.query(query, function(
                  err, rows, fields
                ) {
                    if (err){
                      callback(null, counter);
                    }else{
                      callback(null, rows[0]['quantity'] );
                    }
                }); 

                //console.log(query + 'checking');

            }else{
              callback(null, counter );
            }
        },

        function ( counter , callback ){

              const query = " SELECT meta_value as price  FROM tbl_products_meta WHERE meta_key IN ('price') AND group_id IN ("+product_id_request+") ";
              connection.query(query, function(
                err, rows, fields
              ) {
                  if (err){
                    callback(null, { status : 0, counter : counter , price : rows[0]['price'] });
                  }else{
                    callback(null, { status : 1, counter : counter , price : rows[0]['price'] }  );
                  }
              }); 

              //console.log(query + 'checking');
        }, 
        


      ], function(err, product_detail) {


          if ( product_detail.status===1 ){

            let data_main = new Array();
            data_main = {
                          product_id : product_id_request,
                          quantity : (product_detail.counter + 1),
                          price : product_detail.price
                      }

              counter = parseInt(product_detail.counter);
              if ( counter===0 ){

                  let data_fields = new Array();
                  let data_values = new Array();
                  for (const [key, value] of Object.entries(data_main)) {
                    data_values.push( '"'+value+'"' );
                    data_fields.push( key );
                  }
            
                  let query = " INSERT INTO tbl_orders ("+data_fields.join(',')+") VALUES ("+data_values.join(',')+"); ";
                  connection.query(query, function(
                    err, rows, fields
                  ) {
                      if (err){
                        var returns = { status : 0 };
                        res.status(400).send(JSON.stringify(returns));
                      }else{
                        var returns = { status : 1 };
                        res.send(JSON.stringify(returns));
                      }
                  });  

                  //console.log(query + 'insert');
              }else{

                  let data_meta = new Array();
                  for (const [key, value] of Object.entries(data_main)) {
                    data_meta.push( key+'="'+value+'"' );
                  }
            
                  const data_main_imploded = data_meta.join(', ');

                  let query = " UPDATE tbl_orders SET "+data_main_imploded+"  WHERE product_id IN ("+product_id_request+") ";
                  connection.query(query, function(
                    err, rows, fields
                  ) {
                      if (err){
                        var returns = { status : 0 };
                        res.status(400).send(JSON.stringify(returns));
                      }else{
                        var returns = { status : 1 };
                        res.send(JSON.stringify(returns));
                      }
                  }); 

                // console.log(query + 'udpate');
              } 

          }else{
            var returns = { status : 0 };
            res.status(400).send(JSON.stringify(returns));
          }
              
      });
      
  }else{

    res.status(400).send({ messgae : 'No product found!'});
  }


});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post("/list", async (req, res) => {

  const params_request = req.body;

  try{

    async.waterfall([

      function (callback) {
        let query = "SELECT * FROM tbl_orders WHERE status = 1  ";
        connection.query(query, function(
          err, rows, fields
        ) {
            if (err){
              callback(null, 0 );
            }else{
              callback(null, rows);
            }
        });

      },

      function (product_list, callback) {


        if ( product_list!==0 ){
            const all_products_id_arr =  new Array();
            const all_products_rows = {};
            for (const [key, row] of Object.entries(product_list)) {
              all_products_id_arr.push(row.product_id);
              all_products_rows[row.product_id] = row;
            }

            all_products_id_imploded = all_products_id_arr.join();

            let query = " SELECT * FROM  tbl_products WHERE id IN ("+all_products_id_imploded+") ";
            connection.query(query, function( err,  rows, fields) {
                if (err){
                  callback(null, { status: 0, list : {} });

                }else{

                  let all_products_rows_updated = {};
                  for (const [key, row] of Object.entries(rows)) {
                    if (all_products_rows.hasOwnProperty(row.id)) {
                        all_products_rows[row.id] = {...all_products_rows[row.id], ...{ name : row.name, category_id : row.category_id, featured_status : row.featured_status, status : row.status } };
                    }
                  }

                  all_products_rows_updated = all_products_rows;
                  callback(null, { status: 1, list : all_products_rows_updated  } );

                }
            });

        }else{
           callback(null, { status: 0, list : {} });
        }

       
      }


    ], function(err, results) {

        let product_list = results.list;
        if ( results.status===1 ){

            const all_products_id_arr =  new Array();
            const all_products_rows = {};
            for (const [key, row] of Object.entries(product_list)) {
              all_products_id_arr.push(row.product_id);
              all_products_rows[row.product_id] = row;
            }

            all_products_id_imploded = all_products_id_arr.join();
      
            let query = " SELECT * FROM  tbl_products_meta WHERE group_id IN ("+all_products_id_imploded+") ";
            connection.query(query, function( err,  rows, fields) {
                if (err){
                  res.status(500).send(err);
                }else{
                  
                  let row_meta = UtilitiesHelper._convertArray(rows);
                  for (const [key, value] of Object.entries(row_meta)) {
                      const product_id = value.group_id;
        
                      if (all_products_rows.hasOwnProperty(product_id)) {
                        add_value = all_products_rows[product_id];
                        row_meta[key] = {...row_meta[key], ...add_value };
                      }
                  } 
                  res.send(JSON.stringify(row_meta)); 
                }
            });

        }else{
          res.send(JSON.stringify({})); 
        }

    });

  }catch( err ){
    res.status(400).send(err);
  }

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/deleteById", async (req, res) => {

  const params_request = req.body;
  try{

    connection.query("DELETE  FROM tbl_orders WHERE product_id IN ("+params_request.pids+")", function(err, rows, fields) {
      if (err){
        var returns = { status : 0 }
        res.status(400).send(JSON.stringify(returns));
      }else{
        var returns = { status : 1 }
        res.send(JSON.stringify(returns));
      }
    }); 

  }catch( err ){
    res.status(400).send(err);
  } 

});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
