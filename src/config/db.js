const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;