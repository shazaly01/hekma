import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { backupSheets } from "./exportBackup";

export type ImportMode = "replace" | "merge" | "add_only";

// Tables that can be imported (exclude audit_logs - system generated)
const importableTables = [
  "departments",
  "job_titles",
  "nationalities",
  "card_types",
  "destruction_reasons",
  "employees",
  "employee_cards",
];

// Deletion order respects foreign keys (children first)
const deleteOrder = [
  "employee_cards",
  "employees",
  "destruction_reasons",
  "card_types",
  "nationalities",
  "job_titles",
  "departments",
];

function parseSheetData(wb: XLSX.WorkBook, sheetDef: typeof backupSheets[0]): Record<string, any>[] {
  const ws = wb.Sheets[sheetDef.sheetName];
  if (!ws) return [];

  const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (raw.length < 2) return [];

  const headers = raw[0];
  const rows = raw.slice(1);

  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj: Record<string, any> = {};
      sheetDef.columns.forEach((col, idx) => {
        const headerIdx = headers.indexOf(col.header);
        if (headerIdx === -1) return;
        let val = row[headerIdx];

        if (val === undefined || val === "") {
          obj[col.key] = null;
          return;
        }

        // Convert Arabic booleans back
        if (val === "نعم") val = true as any;
        else if (val === "لا") val = false as any;

        // Try parsing JSON for details field
        if (col.key === "details" && typeof val === "string") {
          try {
            val = JSON.parse(val) as any;
          } catch {
            // keep as string
          }
        }

        obj[col.key] = val;
      });
      return obj;
    });
}

async function deleteTable(table: string) {
  // Delete all rows - supabase requires a filter, use neq with impossible value
  const { error } = await api.delete(`/db/${table}/all`).then(() => ({ error: null })).catch(e => ({ error: e }));
  if (error) throw new Error(`فشل حذف بيانات ${table}: ${error.message}`);
}

async function batchUpsert(table: string, data: Record<string, any>[]) {
  if (data.length === 0) return;

  const batchSize = 500;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await api.post(`/db/${table}/bulk`, { data: batch, mode: "upsert" }).then(() => ({ error: null })).catch(e => ({ error: e }));
    if (error) throw new Error(`فشل استيراد ${table}: ${error.message}`);
  }
}

async function batchInsertOnly(table: string, data: Record<string, any>[]) {
  if (data.length === 0) return;

  const batchSize = 500;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await api.post(`/db/${table}/bulk`, { data: batch, mode: "insert_ignore" }).then(() => ({ error: null })).catch(e => ({ error: e }));
    if (error) throw new Error(`فشل استيراد ${table}: ${error.message}`);
  }
}

export interface ImportResult {
  table: string;
  sheetName: string;
  count: number;
  status: "success" | "skipped" | "error";
  message?: string;
}

export async function importBackup(
  file: File,
  mode: ImportMode,
  onProgress?: (msg: string) => void
): Promise<ImportResult[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const results: ImportResult[] = [];

  // Parse all sheet data first
  const parsedData: Map<string, Record<string, any>[]> = new Map();
  for (const sheetDef of backupSheets) {
    if (!importableTables.includes(sheetDef.table)) continue;
    const data = parseSheetData(wb, sheetDef);
    parsedData.set(sheetDef.table, data);
  }

  // For replace mode, delete in reverse FK order first
  if (mode === "replace") {
    for (const table of deleteOrder) {
      if (!parsedData.has(table)) continue;
      onProgress?.(`جارٍ حذف بيانات ${backupSheets.find((s) => s.table === table)?.sheetName}...`);
      try {
        await deleteTable(table);
      } catch (e: any) {
        results.push({
          table,
          sheetName: backupSheets.find((s) => s.table === table)?.sheetName || table,
          count: 0,
          status: "error",
          message: e.message,
        });
      }
    }
  }

  // Insert in correct FK order (lookup tables first, then employees, then cards)
  for (const sheetDef of backupSheets) {
    if (!importableTables.includes(sheetDef.table)) continue;
    const data = parsedData.get(sheetDef.table) || [];

    if (data.length === 0) {
      results.push({ table: sheetDef.table, sheetName: sheetDef.sheetName, count: 0, status: "skipped", message: "لا توجد بيانات في الورقة" });
      continue;
    }

    onProgress?.(`جارٍ استيراد ${sheetDef.sheetName} (${data.length} سجل)...`);

    try {
      if (mode === "replace") {
        // For replace, we already deleted, now insert
        await batchUpsert(sheetDef.table, data);
      } else if (mode === "merge") {
        await batchUpsert(sheetDef.table, data);
      } else {
        await batchInsertOnly(sheetDef.table, data);
      }
      results.push({ table: sheetDef.table, sheetName: sheetDef.sheetName, count: data.length, status: "success" });
    } catch (e: any) {
      results.push({ table: sheetDef.table, sheetName: sheetDef.sheetName, count: 0, status: "error", message: e.message });
    }
  }

  return results;
}
