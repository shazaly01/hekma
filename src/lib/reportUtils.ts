import { format } from "date-fns";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const fmtDate = (d: string | Date | undefined | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy"); } catch { return "—"; }
};

export function printHTML(html: string) {
  const win = window.open("", "_blank");
  if (!win) { alert("الرجاء السماح بالنوافذ المنبثقة لتصدير PDF"); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  if (win.document.fonts && win.document.fonts.ready) {
    win.document.fonts.ready.then(() => {
      setTimeout(() => { win.print(); }, 800);
    });
  } else {
    setTimeout(() => { win.print(); }, 1500);
  }
}

export const printStyles = `
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
    body{font-family:'Cairo',sans-serif;direction:rtl;padding:24px;color:#1a2a3a;font-size:12px}
    .page-header{background:#1c375a!important;color:#fff!important;padding:16px 20px;border-radius:8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
    .page-header h1{font-size:17px;font-weight:700;color:#fff!important}
    .page-header p{font-size:10px;opacity:.8;margin-top:3px;color:#fff!important}
    .page-header .stamp{font-size:10px;opacity:.7;white-space:nowrap;color:#fff!important}
    .filters-bar{background:#f0f5fc!important;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:10px;color:#1c375a}
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
    .stat-box{background:#f0f5fc!important;border-radius:6px;padding:10px;text-align:center}
    .stat-box .num{font-size:22px;font-weight:700;color:#1c375a}
    .stat-box .lbl{font-size:9px;color:#64748b;margin-top:2px}
    .section{margin-bottom:22px}
    .section-title{font-size:13px;font-weight:700;color:#1c375a;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #1c375a}
    table{width:100%;border-collapse:collapse}
    th{background:#1c375a!important;color:#fff!important;padding:9px 10px;text-align:center;font-size:11px;font-weight:600}
    td{padding:7px 10px;text-align:center;border-bottom:1px solid #e2e8f0;font-size:11px}
    tr:nth-child(even) td{background:#f5f8fc!important}
    .badge-red{background:#fee2e2!important;color:#b91c1c!important;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
    .badge-green{background:#dcfce7!important;color:#166534!important;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
    .badge-yellow{background:#fef9c3!important;color:#854d0e!important;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
    .badge-gray{background:#f1f5f9!important;color:#475569!important;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
    .footer{margin-top:24px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    @media print{body{padding:10px}@page{margin:12mm;size:A4}}
  </style>
`;
