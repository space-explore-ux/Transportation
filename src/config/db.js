const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.tidb_DB_HOST,
  user: process.env.tidb_DB_USER,
  password: process.env.tidb_DB_PASS,
  database: process.env.tidb_DB_NAME,
  port: process.env.tidb_DB_PORT || 4000, 
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  // Added for better scalability under load
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// We add .promise() here! This is the secret to making 
// async/await work in our new Models.
module.exports = pool.promise();