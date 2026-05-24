const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lovable_app',
  });

  const [r] = await conn.query("DELETE FROM users WHERE email = 'admin@admin'");

  if (r.affectedRows > 0) {
    console.log('✅ تم حذف حساب admin@admin بنجاح.');
  } else {
    console.log('ℹ️ لم يُعثر على حساب admin@admin.');
  }

  const [remaining] = await conn.query("SELECT email, is_super_admin FROM users");
  console.log('\n📋 الحسابات المتبقية:');
  console.table(remaining);

  await conn.end();
}
run().catch(console.error);
