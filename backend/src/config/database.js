const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'studybuddy',
  user: process.env.DB_USER || 'studybuddy',
  password: process.env.DB_PASSWORD || 'studybuddy123',
});

module.exports = pool;
