var express = require("express");
const connection = require('../model/connection');
var utilities  = require('../helpers/utilities').Utilities;
var async = require("async");
var router = express.Router();

var UtilitiesHelper = new utilities();


router.post("/list", async (req, res) => {

    const params_request = req.body;
    let sql_limit_arr = new Array();

    if (params_request.hasOwnProperty('page')) {
      let page = ( parseInt(params_request['page'])===1) ? 0 :  parseInt(params_request['page']);
      if (page>1){ page = page-1; }
      sql_limit_arr.push( page );
    }

    if (params_request.hasOwnProperty('limit')) {
      sql_limit_arr.push( parseInt(params_request['limit']) );
    }

    async.parallel({
      user_list: function(callback) {

        let query = "SELECT * FROM tbl_products WHERE status = 1 ORDER BY name ASC ";
        if ( sql_limit_arr.length>1 ){
          query += " LIMIT "+sql_limit_arr.join(',');
        }

        if (params_request.hasOwnProperty('id')) {
          query = " SELECT * FROM tbl_products WHERE id IN ("+params_request['id']+")";
        }

        connection.query(query, function(
          err, rows, fields
        ) {
            if (err){
              callback(null, new Array() );
            }else{
              callback(null, rows);
            }
        });

      },
      total_list: function(callback) {

          const query = " SELECT COUNT(*) as total FROM tbl_products WHERE status = 1";
          connection.query(query, function(
            err, rows, fields
          ) {
              if (err){
                callback(null, 0);
              }else{
                callback(null, rows[0]['total']);
              }
          });
      }

    }, function(err, results) {

            try{

              const total_list = results.total_list;
              let product_list = results.product_list;
        
              const all_products_id_arr =  new Array();
              const all_products_rows = {};
              for (const [key, row] of Object.entries(product_list)) {
                all_products_id_arr.push(row.id);
                all_products_rows[row.id] = row;
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
              
        
            }catch( err ){
              res.status(400).send(err);
            } 
    });
});



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/add',function(req, res){

  const meta_data = req.body;

  async.waterfall([
    
    function(callback) {

      let data_main = new Array();
      data_main = {
                      name : meta_data.name,
                      category_id : meta_data.category_id,
                      featured_status : meta_data.featured_status,
                      status : meta_data.status,
                  }

      if (meta_data.hasOwnProperty('date_created')) {
        data_main = { ...data_main, ...{ date_created : meta_data['date_created'] } };
      }
            
      let data_fields = new Array();
      let data_values = new Array();
      for (const [key, value] of Object.entries(data_main)) {
        data_values.push( '"'+value+'"' );
        data_fields.push( key );
      }

      let query = " INSERT INTO tbl_products ("+data_fields.join(',')+") VALUES ("+data_values.join(',')+"); ";
      connection.query(query, function(
        err, rows, fields
      ) {
          if (err){
            callback(null, 0);
          }else{
            callback(null, rows.insertId);
          }
      }); 

    }

  ], function(err, result) {

     if (err) throw err;

     if ( parseInt(result)>0 ){
        const product_id = result;

        let data_meta = {
          gallery :'',
          image : '',
          price : meta_data.price,
          description : meta_data.description
        }
      
       let query_update = '';
        for (const [key, value] of Object.entries(data_meta) ) {
          query_update += " INSERT INTO tbl_products_meta (group_id, meta_key, meta_value) VALUES ('"+product_id+"', '"+key+"', '"+value+"'); ";
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/update',function(req, res){

  const meta_data = req.body;
  const product_id = parseInt(meta_data.id);

  async.parallel({

    product_main: function(callback) {

      let data_main = new Array();
      data_main = {
                      username : meta_data.username,
                      first_name : meta_data.first_name,
                      last_name : meta_data.last_name,
                      type : meta_data.type,
                      status : meta_data.status,
                  }

      let data_meta = new Array();
      for (const [key, value] of Object.entries(data_main)) {
        data_meta.push( key+'="'+value+'"' );
      }

      const data_main_imploded = data_meta.join(', ');

      let query = " UPDATE tbl_products SET "+data_main_imploded+"  WHERE id IN ("+product_id+") ";
      connection.query(query, function(
        err, rows, fields
      ) {
          if (err){
            callback(null, 0);
          }else{
            callback(null, 1);
          }
      }); 

    }

  }, function(err, results) {

     if (err) throw err;

     if (parseInt(results.product_main)>0 ){

        let data_meta = {
          gallery :'',
          image : '',
          price : meta_data.price,
          description : meta_data.description
        }
      
       let query_update = '';
        for (const [key, value] of Object.entries(data_meta) ) {
          query_update += " UPDATE tbl_products_meta SET meta_value = '"+value+"' WHERE meta_key LIKE '"+key+"' AND  group_id IN ("+product_id+"); ";
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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/deleteById/:ids", async (req, res) => {
  
  ids = req.params.ids;

  async.parallel({
    user_main: function(callback) {

      connection.query("DELETE  FROM tbl_products WHERE id IN ("+ids+")", function(err, rows, fields) {
            if (err){
              callback(null, 0);
            }else{
              callback(null, 1);
            }
        }); 
    }
  }, function(err, results) {

    if (err) throw err;

    if (parseInt(results.user_main)>0){

      try{

        connection.query("DELETE  FROM tbl_products_meta WHERE group_id IN ("+ids+")", function(err, rows, fields) {
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

    }

  });

});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


module.exports = router;
