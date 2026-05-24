/**
 * Migration: Add performance indexes for frequently queried columns.
 * Run with: node backend/migrations/add_indexes.js
 */
const pool = require('../config/db');

const indexes = [
  'ALTER TABLE employees ADD INDEX idx_emp_department (department)',
  'ALTER TABLE employees ADD INDEX idx_emp_status (status)',
  'ALTER TABLE employees ADD INDEX idx_emp_section (section)',
  'ALTER TABLE employees ADD INDEX idx_emp_nationality (nationality)',
  'ALTER TABLE employees ADD INDEX idx_emp_created_at (created_at)',
  'ALTER TABLE employee_cards ADD INDEX idx_card_is_destroyed (is_destroyed)',
  'ALTER TABLE employee_cards ADD INDEX idx_card_expiry_date (expiry_date)',
  'ALTER TABLE employee_cards ADD INDEX idx_card_issue_date (issue_date)',
  'ALTER TABLE employee_cards ADD INDEX idx_card_issue_type (issue_type)',
  'ALTER TABLE notifications ADD INDEX idx_notif_user_id (user_id)',
  'ALTER TABLE notifications ADD INDEX idx_notif_is_read (is_read)',
  'ALTER TABLE notifications ADD INDEX idx_notif_created_at (created_at)',
  'ALTER TABLE audit_logs ADD INDEX idx_audit_created_at (created_at)',
  'ALTER TABLE audit_logs ADD INDEX idx_audit_user_id (user_id)',
  'ALTER TABLE audit_logs ADD INDEX idx_audit_entity_type (entity_type)',
];

(async () => {
  for (const sql of indexes) {
    const name = sql.match(/ADD INDEX (\w+)/)[1];
    try {
      await pool.query(sql);
      console.log('✅ OK:', name);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') console.log('⏭️  SKIP (already exists):', name);
      else console.error('❌ ERR [' + name + ']:', e.message);
    }
  }
  console.log('\nAll indexes processed.');
  process.exit(0);
})();
