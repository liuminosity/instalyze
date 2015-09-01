var mysql = require('mysql');

var connection = mysql.createConnection({
  user: "root",
  password: "",
  database: "instalyze"
});

connection.connect();

module.exports = connection;