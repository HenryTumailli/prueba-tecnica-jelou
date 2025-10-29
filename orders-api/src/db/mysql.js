const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Mensaje para confirmar la conexión exitosa
pool.getConnection()
  .then(connection => {
    console.log('Orders API connected to MySQL database!');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to MySQL:', err.stack);
  });

module.exports = pool;