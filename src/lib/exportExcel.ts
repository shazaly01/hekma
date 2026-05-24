import * as XLSX from "xlsx";

interface Column {
  header: string;
  render: (row: any) => string;
}

export function exportExcel(
  filename: string,
  data: any[],
  columns: Column[],
  sheetName = "تقرير"
) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((col) => col.render(row) || "—"));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws["!cols"] = columns.map(() => ({ wch: 20 }));

  // Style header row
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
