const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

async function init() {
  try {
    console.log('Connecting to MySQL (make sure XAMPP/MySQL is running)...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('Connected to MySQL server.');

    // Replace the default DB name if it's lovable_app with the one from env
    const dbName = process.env.DB_NAME || 'employee_cards_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${dbName}' ensured.`);

    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Replace hardcoded 'USE lovable_app' or 'CREATE DATABASE lovable_app' in schema just in case
    schemaSql = schemaSql.replace(/lovable_app/g, dbName);
    
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema tables imported successfully.');

    const email = 'admin@admin';
    const rawPassword = '12345678';
    
    // Check if employee cards specific UUID exists or just generate random string
    const id = crypto.randomUUID();

    const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length === 0) {
      const hash = await bcrypt.hash(rawPassword, 10);
      await connection.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, hash]);
      
      const roleId = crypto.randomUUID();
      await connection.query("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')", [roleId, id]);
      
      const profileId = crypto.randomUUID();
      await connection.query("INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, 'Admin')", [profileId, id]);
      
      console.log(`\n### Admin account created successfully!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${rawPassword}\n`);
    } else {
      console.log('\n### Admin user already exists. Skipping creation.\n');
    }

    await connection.end();
    console.log('Initialization complete.');
  } catch (err) {
    console.error('\n[ERROR] Failed to initialize database:');
    if (err.code === 'ECONNREFUSED') {
       console.error('MySQL server is not running on localhost:3306. Please start MySQL (e.g. via XAMPP).');
    } else {
       console.error(err.message);
    }
  }
}

init();
