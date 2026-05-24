import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { printStyles } from "./reportUtils";

/**
 * Export HTML report content as a downloadable PDF file.
 * Uses html2canvas for perfect Arabic/RTL rendering.
 */
export async function exportPdf(htmlContent: string, filename: string) {
  const toastId = toast.loading("جارٍ إنشاء ملف PDF...");

  try {
    // Create a hidden container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px"; // A4 width at 96dpi
    container.style.background = "#fff";
    container.style.zIndex = "-1";
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for fonts to load
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    // Small delay for images/styles to settle
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages if content exceeds one page
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
    toast.success("تم تحميل ملف PDF بنجاح", { id: toastId });
  } catch (err) {
    console.error("PDF export error:", err);
    toast.error("فشل إنشاء ملف PDF", { id: toastId });
  }
}

/**
 * Build a full HTML document for PDF rendering with Arabic styling.
 */
export function buildPdfHtml(bodyContent: string): string {
  return `<div style="font-family:'Cairo',sans-serif;direction:rtl;padding:24px;color:#1a2a3a;font-size:12px;">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      .page-header{background:#1c375a;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
      .page-header h1{font-size:17px;font-weight:700;color:#fff}
      .page-header p{font-size:10px;opacity:.8;margin-top:3px;color:#fff}
      .page-header .stamp{font-size:10px;opacity:.7;white-space:nowrap;color:#fff;text-align:left}
      .filters-bar{background:#f0f5fc;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:10px;color:#1c375a}
      .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
      .stat-box{background:#f0f5fc;border-radius:6px;padding:10px;text-align:center}
      .stat-box .num{font-size:22px;font-weight:700;color:#1c375a}
      .stat-box .lbl{font-size:9px;color:#64748b;margin-top:2px}
      .section{margin-bottom:22px}
      .section-title{font-size:13px;font-weight:700;color:#1c375a;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #1c375a}
      table{width:100%;border-collapse:collapse}
      th{background:#1c375a;color:#fff;padding:9px 10px;text-align:center;font-size:11px;font-weight:600}
      td{padding:7px 10px;text-align:center;border-bottom:1px solid #e2e8f0;font-size:11px}
      tr:nth-child(even) td{background:#f5f8fc}
      .badge-red{background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
      .badge-green{background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
      .badge-yellow{background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
      .badge-gray{background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:20px;font-size:10px;display:inline-block}
      .footer{margin-top:24px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    </style>
    ${bodyContent}
  </div>`;
}
