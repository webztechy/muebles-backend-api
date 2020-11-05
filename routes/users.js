var express = require("express");
var sha1 = require('sha1');
//const dotenv = require('dotenv');
const connection = require('../model/connection');
var utilities  = require('../helpers/utilities').Utilities;
var async = require("async");
var router = express.Router();

var UtilitiesHelper = new utilities();


router.post("/login", async (req, res) => {

  const params_request = req.body;

  try{

    password_request_encoded = sha1(params_request['password']);

    const query = "SELECT * FROM tbl_users WHERE username LIKE '"+params_request['username']+"' AND password  LIKE '"+password_request_encoded+"' ";
    connection.query( query , function(
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

});


router.post("/list", async (req, res) => {

  const params_request = req.body;

  async.parallel({

    user_list: function(callback) {

      let query = "SELECT * FROM tbl_users ORDER BY first_name ASC ";

      if (params_request.hasOwnProperty('id')) {
        query = " SELECT * FROM tbl_users WHERE id IN ("+params_request['id']+")";
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

    }

  }, function(err, results) {

    try{

      let user_list = results.user_list;
      
      const all_users_id_arr =  new Array();
      const all_users_rows = {};
      for (const [key, row] of Object.entries(user_list)) {
        all_users_id_arr.push(row.id);
        all_users_rows[row.id] = row;
      }

      all_users_id_imploded = all_users_id_arr.join();

      let query = " SELECT * FROM  tbl_users_meta WHERE group_id IN ("+all_users_id_imploded+") ";
      connection.query(query, function( err,  rows, fields) {
          if (err){
            res.status(500).send(err);
          }else{
            
            let row_meta = UtilitiesHelper._convertArray(rows);
            for (const [key, value] of Object.entries(row_meta)) {
                const user_id = value.group_id;
   
                if (all_users_rows.hasOwnProperty(user_id)) {
                  add_value = all_users_rows[user_id];
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


router.post('/add',function(req, res){

  const meta_data = req.body;

  async.waterfall([
    
    function(callback) {

      let data_main = new Array();
      data_main = {
                      username : meta_data.username,
                      first_name : meta_data.first_name,
                      last_name : meta_data.last_name,
                      type : meta_data.type,
                      status : meta_data.status,
                  }

      if (meta_data.hasOwnProperty('password')) {
          password_request = meta_data['password'];
          password_request_encoded = sha1(password_request);

          data_main = { ...data_main, ...{ password : password_request_encoded } };
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

      let query = " INSERT INTO tbl_users ("+data_fields.join(',')+") VALUES ("+data_values.join(',')+"); ";
      connection.query(query, function(
        err, rows, fields
      ) {
          if (err){
            callback(null, 0);
          }else{
            callback(null, rows.insertId);
          }
      }); 

    },
    function( new_user_id, callback) {

      if (req.files !== null) {
        const file = req.files.avatar;
        //file.mv(`backend/public/uploads/users/${file.name}`, err => {
        file.mv(`uploads/users/${file.name}`, err => {
          if (err) {
             callback(null, 0);
          }else{

            let query = " UPDATE tbl_users SET avatar = '"+file.name+"' WHERE id IN ("+new_user_id+") ";
            connection.query(query, function( err, rows, fields ) {
                if (err){
                  callback(null, 0);
                }else{
                  callback(null, new_user_id);
                }
            });
          }
        });
    
      }else{
        callback(null, new_user_id);
      }
    }

  ], function(err, result) {

     if (err) throw err;

     if ( parseInt(result)>0 ){
        const user_id = result;

        let data_meta = {
          address : meta_data.address,
          contact_number : meta_data.contact_number,
          email : meta_data.email
        }
      
       let query_update = '';
        for (const [key, value] of Object.entries(data_meta) ) {
          query_update += " INSERT INTO tbl_users_meta (group_id, meta_key, meta_value) VALUES ('"+user_id+"', '"+key+"', '"+value+"'); ";
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

  /* if (req.files !== null) {
    const file = req.files.avatar;
    //console.log(file);

    //file.mv(`${__dirname}/backend/public/uploads/${file.name}`, err => {
    file.mv(`backend/public/uploads/${file.name}`, err => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }
  
      res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
    });

  }

  if (req.body !== null) {
    const meta_data = req.body;
    console.log(meta_data);
  } */

  const meta_data = req.body;
  const user_id = parseInt(meta_data.id);

  async.parallel({

    user_main: function(callback) {

      let data_main = new Array();
      data_main = {
                      username : meta_data.username,
                      first_name : meta_data.first_name,
                      last_name : meta_data.last_name,
                      type : meta_data.type,
                      status : meta_data.status,
                  }

      if (meta_data.hasOwnProperty('password')) {
          password_request = meta_data['password'];
          password_request_encoded = sha1(password_request);

          data_main = { ...data_main, ...{ password : password_request_encoded } };
      }
 
      if (meta_data.hasOwnProperty('date_created')) {
        data_main = { ...data_main, ...{ date_created : meta_data['date_created'] } };
      }
      
      let data_meta = new Array();
      for (const [key, value] of Object.entries(data_main)) {
        data_meta.push( key+'="'+value+'"' );
      }

      const data_main_imploded = data_meta.join(', ');

      let query = " UPDATE tbl_users SET "+data_main_imploded+"  WHERE id IN ("+user_id+") ";
      connection.query(query, function(
        err, rows, fields
      ) {
          if (err){
            callback(null, 0);
          }else{
            callback(null, 1);
          }
      }); 

    },
    user_avatar: function(callback) {

      if (req.files !== null) {
        const file = req.files.avatar;
        //file.mv(`backend/public/uploads/users/${file.name}`, err => {
         file.mv(`uploads/users/${file.name}`, err => {
        // console.log(`${__dirname}/backend/public/uploads/users/${file.name}`);
        //file.mv(`${__dirname}/backend/public/uploads/users/${file.name}`, err => {
          if (err) {
             callback(null, 0);
          }else{

            let query = " UPDATE tbl_users SET avatar = '"+file.name+"' WHERE id IN ("+user_id+") ";
            connection.query(query, function( err, rows, fields ) {
                if (err){
                  callback(null, 0);
                }else{
                  callback(null, 1);
                }
            });
          }
        });
    
      }else{
        callback(null, 1);
      }
    }

  }, function(err, results) {

     if (err) throw err;

     if (parseInt(results.user_main)>0 && parseInt(results.user_avatar)>0){

        let data_meta = {
          address : meta_data.address,
          contact_number : meta_data.contact_number,
          email : meta_data.email
        }
      
       let query_update = '';
        for (const [key, value] of Object.entries(data_meta) ) {
          query_update += " UPDATE tbl_users_meta SET meta_value = '"+value+"' WHERE meta_key LIKE '"+key+"' AND  group_id IN ("+user_id+"); ";
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


router.get("/deleteById/:ids", async (req, res) => {
  
  ids = req.params.ids;

  async.parallel({
    user_main: function(callback) {

      connection.query("DELETE  FROM tbl_users WHERE id IN ("+ids+")", function(err, rows, fields) {
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

        connection.query("DELETE  FROM tbl_users_meta WHERE group_id IN ("+ids+")", function(err, rows, fields) {
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


module.exports = router;
