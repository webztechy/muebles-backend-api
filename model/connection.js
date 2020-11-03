const dotenv = require('dotenv');
var mysql = require("mysql");

dotenv.config();

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true // for multiple sql execution
});

connection.connect(function(err) {
    if (!err) {
      console.log("Database is connected ... \n\n");
    } else {
      console.log("Error connecting database ... \n\n");
    }
});

module.exports = connection;



