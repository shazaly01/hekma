const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lovable_app'
    });
    
    const [result] = await connection.query("UPDATE users SET email = 'admin@admin.com' WHERE email = 'admin@admin'");
    
    if (result.affectedRows > 0) {
      console.log("Admin email successfully updated to admin@admin.com");
    } else {
      console.log("Admin email 'admin@admin' not found. It might have already been updated.");
    }

    await connection.end();
  } catch(e) {
    console.error(e);
  }
}
run();
