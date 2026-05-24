/**
 * create_superadmin.js
 * =====================
 * ينشئ حساب السوبر أدمن الثابت:
 *   username (email): super@admin.com
 *   password        : s8087090
 *
 * الميزات:
 *  - لا يمكن تعديله أو حذفه عبر واجهة الإدارة
 *  - هو الوحيد القادر على حذف الموظفين وبطاقاتهم
 *
 * تشغيل السكريبت:
 *   node create_superadmin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

async function createSuperAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'employee_cards_db',
    });

    console.log('✅ Connected to database.');

    // تأكد من وجود عمود is_super_admin
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE
    `).catch(() => {
      // قد يكون العمود موجوداً مسبقاً — تجاهل الخطأ
    });

    const email = 'super@admin.com';
    const rawPassword = 's8087090';

    const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      // تحديث كلمة المرور وتفعيل is_super_admin في حال وجود الحساب مسبقاً
      const hash = await bcrypt.hash(rawPassword, 10);
      await connection.query(
        'UPDATE users SET password_hash = ?, is_super_admin = TRUE WHERE email = ?',
        [hash, email]
      );
      console.log('\n🔄 حساب superadmin موجود مسبقاً — تم تحديثه وتفعيل صلاحية المدير العام.\n');
    } else {
      const id = crypto.randomUUID();
      const hash = await bcrypt.hash(rawPassword, 10);

      await connection.query(
        'INSERT INTO users (id, email, password_hash, is_super_admin) VALUES (?, ?, ?, TRUE)',
        [id, email, hash]
      );

      // دور admin في user_roles
      const roleId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
        [roleId, id]
      );

      // ملف تعريف
      const profileId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, 'Super Admin')",
        [profileId, id]
      );

      console.log('\n🎉 تم إنشاء حساب Super Admin بنجاح!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  اسم المستخدم : ${email}`);
      console.log(`  كلمة المرور  : ${rawPassword}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    await connection.end();
    console.log('✅ اكتملت العملية.');
  } catch (err) {
    console.error('\n[خطأ] فشل إنشاء حساب السوبر أدمن:');
    if (err.code === 'ECONNREFUSED') {
      console.error('MySQL غير مشغّل. يرجى تشغيل XAMPP أو MySQL أولاً.');
    } else {
      console.error(err.message);
    }
    if (connection) await connection.end().catch(() => {});
    process.exit(1);
  }
}

createSuperAdmin();
