// Centralized permission definitions per page/action
// Roles: admin | editor | data_entry | viewer

export type AppRole = "admin" | "editor" | "data_entry" | "viewer";

export const permissions = {
  // ─── Employees ───────────────────────────────────────────────────
  // مدير + محرر + مدخل بيانات: إضافة موظف
  employeeCreate: ["admin", "editor", "data_entry"] as AppRole[],
  // مدير + محرر فقط: تعديل الموظف
  employeeEdit: ["admin", "editor"] as AppRole[],
  // مدير فقط: حذف
  employeeDelete: ["admin"] as AppRole[],
  // مدير فقط: استيراد Excel
  employeeImportExcel: ["admin"] as AppRole[],
  // مدير + محرر + مدخل بيانات: رفع صورة
  employeeUploadPhoto: ["admin", "editor", "data_entry"] as AppRole[],
  // مدير + محرر + مدخل بيانات: رفع ملف أرشيف
  employeeUploadArchive: ["admin", "editor", "data_entry"] as AppRole[],
  // مدير فقط: حذف ملف أرشيف
  employeeDeleteArchive: ["admin"] as AppRole[],

  // ─── Cards ───────────────────────────────────────────────────────
  // مدير + محرر + مدخل بيانات: إصدار بطاقة
  cardCreate: ["admin", "editor", "data_entry"] as AppRole[],
  // مدير + محرر فقط: تعديل بطاقة
  cardEdit: ["admin", "editor"] as AppRole[],
  // مدير فقط: حذف بطاقة
  cardDelete: ["admin"] as AppRole[],

  // ─── Settings ────────────────────────────────────────────────────
  // مدير + محرر: الإعدادات (إدارات، وظائف ...)
  settingsManage: ["admin", "editor"] as AppRole[],
  // مدير فقط: استيراد نسخة احتياطية
  backupImport: ["admin"] as AppRole[],

  // ─── Users & Roles ───────────────────────────────────────────────
  // مدير فقط: إدارة صلاحيات المستخدمين
  rolesManage: ["admin"] as AppRole[],

  // ─── Audit & QR ──────────────────────────────────────────────────
  // مدير + محرر: سجل النشاطات
  auditLogView: ["admin", "editor"] as AppRole[],
  // مدير + محرر: سجل مسح QR
  qrScansView: ["admin", "editor"] as AppRole[],

  // ─── Reports (all roles) ─────────────────────────────────────────
  reportsView: ["admin", "editor", "data_entry", "viewer"] as AppRole[],
  reportsExport: ["admin", "editor", "data_entry", "viewer"] as AppRole[],
} as const;

export function hasPermission(role: AppRole | null | undefined, permission: AppRole[]): boolean {
  if (!role) return false;
  return permission.includes(role);
}
