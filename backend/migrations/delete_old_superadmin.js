const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lovable_app',
  });

  const [r] = await conn.query("DELETE FROM users WHERE email = 'superadmin'");
  if (r.affectedRows > 0) {
    console.log('✅ تم حذف الحساب القديم (superadmin).');
  } else {
    console.log('ℹ️ لم يوجد حساب قديم باسم superadmin.');
  }

  await conn.end();
}
run().catch(console.error);
