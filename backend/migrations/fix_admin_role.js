const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lovable_app',
  });

  // اعرض الحالة الحالية
  const [rows] = await conn.query(`
    SELECT u.email, u.is_super_admin, ur.role 
    FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id
  `);
  console.log('\n📋 الحسابات الموجودة:');
  console.table(rows);

  // تأكد أن admin@admin.com ليس super admin
  const [result] = await conn.query(
    "UPDATE users SET is_super_admin = FALSE WHERE email = 'admin@admin.com'"
  );

  if (result.affectedRows > 0) {
    console.log('✅ تم التأكد: admin@admin.com هو مشرف عادي فقط (بدون صلاحية الحذف).');
  } else {
    console.log('ℹ️ لم يُعثر على حساب admin@admin.com.');
  }

  // اعرض الحالة بعد التعديل
  const [after] = await conn.query(`
    SELECT u.email, u.is_super_admin, ur.role 
    FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id
  `);
  console.log('\n📋 بعد التعديل:');
  console.table(after);

  await conn.end();
}
run().catch(console.error);
