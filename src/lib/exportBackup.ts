import * as XLSX from "xlsx";
import { api } from "@/lib/api";

async function fetchAll(table: string) {
  const pageSize = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await api.get(`/db/${table}`, { params: { offset: from, limit: pageSize } });
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    hasMore = data.length === pageSize;
    from += pageSize;
  }

  return allData;
}

export interface SheetDef {
  table: string;
  sheetName: string;
  columns: { header: string; key: string }[];
}

export const backupSheets: SheetDef[] = [
  {
    table: "departments",
    sheetName: "الإدارات",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "job_titles",
    sheetName: "الوظائف",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "nationalities",
    sheetName: "الجنسيات",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "card_types",
    sheetName: "أنواع البطاقات",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "رابط الشعار", key: "logo_url" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "destruction_reasons",
    sheetName: "أسباب الإتلاف",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "employees",
    sheetName: "الموظفون",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الاسم", key: "name" },
      { header: "الرقم الوظيفي", key: "employee_number" },
      { header: "الإدارة", key: "department" },
      { header: "الوظيفة", key: "job_title" },
      { header: "الجنسية", key: "nationality" },
      { header: "رقم الجواز/الهوية", key: "passport_number" },
      { header: "رقم البطاقة", key: "card_number" },
      { header: "الحالة", key: "status" },
      { header: "رابط الصورة", key: "photo_url" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "employee_cards",
    sheetName: "البطاقات",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "معرف الموظف", key: "employee_id" },
      { header: "نوع البطاقة", key: "card_type_id" },
      { header: "نوع الإصدار", key: "issue_type" },
      { header: "تاريخ الإصدار", key: "issue_date" },
      { header: "تاريخ الانتهاء", key: "expiry_date" },
      { header: "متلفة", key: "is_destroyed" },
      { header: "تاريخ الإتلاف", key: "destruction_date" },
      { header: "سبب الإتلاف", key: "destruction_reason_id" },
      { header: "البطاقة القديمة مرجعة", key: "old_card_returned" },
      { header: "سبب عدم الإرجاع", key: "non_return_reason" },
      { header: "السبب", key: "reason" },
      { header: "ملاحظات", key: "notes" },
      { header: "تاريخ الإنشاء", key: "created_at" },
    ],
  },
  {
    table: "audit_logs",
    sheetName: "سجل النشاطات",
    columns: [
      { header: "المعرف", key: "id" },
      { header: "الإجراء", key: "action" },
      { header: "نوع الكيان", key: "entity_type" },
      { header: "معرف الكيان", key: "entity_id" },
      { header: "معرف المستخدم", key: "user_id" },
      { header: "البريد الإلكتروني", key: "user_email" },
      { header: "التفاصيل", key: "details" },
      { header: "التاريخ", key: "created_at" },
    ],
  },
];

export async function exportBackup() {
  const wb = XLSX.utils.book_new();

  for (const sheet of backupSheets) {
    const data = await fetchAll(sheet.table);
    const headers = sheet.columns.map((c) => c.header);
    const rows = data.map((row) =>
      sheet.columns.map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        if (typeof val === "boolean") return val ? "نعم" : "لا";
        return String(val);
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = sheet.columns.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `نسخة_احتياطية_${today}.xlsx`);
}
