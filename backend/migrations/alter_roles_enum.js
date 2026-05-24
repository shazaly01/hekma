/**
 * One-time migration: add 'editor' to the user_roles ENUM
 * Run once: node alter_roles_enum.js
 */
require('dotenv').config();
const pool = require('./config/db');

async function run() {
  try {
    await pool.query(`
      ALTER TABLE user_roles
      MODIFY COLUMN role ENUM('admin', 'editor', 'data_entry', 'viewer') DEFAULT 'viewer'
    `);
    console.log('✅ user_roles ENUM updated — editor role added.');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
run();
