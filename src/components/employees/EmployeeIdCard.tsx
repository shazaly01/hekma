import jsPDF from "jspdf";
import { getFileUrl } from "@/lib/utils";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

interface CardOptions {
  logoUrl?: string | null;
  cardTypeName?: string | null;
  expiryDate?: string | null;
  websiteText?: string | null;
  backInstructions?: string | null;
  cardTitle?: string | null;
  companyName?: string | null;
  departmentColor?: string | null;
  issueDate?: string | null;
}

// Crisp Vector SVG Logo for 'الجهاز الوطني للتنمية' with geometric precision to prevent blurriness in htmlToImage
const logoSvg = `
  <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" style="flex-shrink:0; display:block;">
    <defs>
      <clipPath id="logo-circle-clip">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
    </defs>
    <!-- Background circle for sharp border -->
    <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
    <g clip-path="url(#logo-circle-clip)">
      <!-- Gold bottom background -->
      <rect width="100" height="100" fill="#8c7247" />
      
      <!-- White wave separator -->
      <path d="M -10 56 C 20 86, 40 21, 70 31 C 88 37, 98 56, 110 51 L 110 -10 L -10 -10 Z" fill="#ffffff" />
      
      <!-- Navy blue top wave -->
      <path d="M -10 50 C 20 80, 40 15, 70 25 C 88 31, 98 50, 110 45 L 110 -10 L -10 -10 Z" fill="#0b2240" />
      
      <!-- White Star in Navy section -->
      <polygon points="66,13 67.8,17.5 72.5,17.5 68.7,20.3 70.2,24.7 66,22 61.8,24.7 63.3,20.3 59.5,17.5 64.2,17.5" fill="#ffffff" />
    </g>
  </svg>
`;

// Large Vector SVG Logo for the back side center
const logoSvgLarge = `
  <svg width="95" height="95" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" style="display:block; margin: 0 auto;">
    <defs>
      <clipPath id="logo-large-circle-clip">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
    </defs>
    <!-- Background circle for sharp border -->
    <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
    <g clip-path="url(#logo-large-circle-clip)">
      <!-- Gold bottom background -->
      <rect width="100" height="100" fill="#8c7247" />
      
      <!-- White wave separator -->
      <path d="M -10 56 C 20 86, 40 21, 70 31 C 88 37, 98 56, 110 51 L 110 -10 L -10 -10 Z" fill="#ffffff" />
      
      <!-- Navy blue top wave -->
      <path d="M -10 50 C 20 80, 40 15, 70 25 C 88 31, 98 50, 110 45 L 110 -10 L -10 -10 Z" fill="#0b2240" />
      
      <!-- White Star in Navy section -->
      <polygon points="66,13 67.8,17.5 72.5,17.5 68.7,20.3 70.2,24.7 66,22 61.8,24.7 63.3,20.3 59.5,17.5 64.2,17.5" fill="#ffffff" />
    </g>
  </svg>
`;

// Empty watermark to keep background clean white matching the user's design image
const logoWatermark = ``;

/**
 * Format expiry date to YYYY-MM-DD cleanly
 */
function formatExpiryDate(dateStr?: string | null): string {
  if (!dateStr) return "2026-11-30";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Build the front-side HTML of the professional ID card.
 */
function buildFrontHtml(employee: Employee, publicUrl: string, opts: CardOptions): string {
  const photoHtml = employee.photo_url
    ? `<img src="${getFileUrl(employee.photo_url)}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:36px;color:#94a3b8;font-weight:700;direction:rtl;">${employee.name.charAt(0)}</div>`;

  const companyName = opts.companyName || "الجهاز الوطني للتنمية";
  const cardTitle = opts.cardTitle || opts.cardTypeName || "بطاقة موظف";
  const websiteText = opts.websiteText || "www.nda.ly";
  const primaryColor = opts.departmentColor || "#1a5b9c"; // Use department color or default

  return `
    <div style="width:320px;height:506px;font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;position:relative;overflow:hidden;background:#ffffff;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      
      <!-- Top Blue Header Section -->
      <div style="background:${primaryColor}; height:110px; width:100%; position:absolute; top:0; left:0; z-index:1; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px;"></div>

      <!-- Logo & Company Name -->
      <div style="position:absolute; right:20px; top:20px; display:flex; align-items:center; z-index:2; direction:rtl; width:280px; justify-content: space-between;">
        <div style="display:flex; flex-direction:column; justify-content:center; color:#ffffff; text-align:right; flex-grow:1;">
          <div style="font-size:16px; font-weight:800; font-family:'Cairo',sans-serif; line-height:1.2; color:#ffffff; margin:0;">${companyName}</div>
          <div style="font-size:12px; font-weight:600; font-family:'Cairo',sans-serif; line-height:1.1; color:#e0e7ff; margin-top:2px;">${cardTitle}</div>
        </div>
        ${opts.logoUrl ? `<img src="${getFileUrl(opts.logoUrl)}" crossorigin="anonymous" style="width:45px; height:45px; object-fit:contain; flex-shrink:0; background:white; padding:2px; border-radius:8px;" />` : ''}
      </div>

      <!-- Centered Rounded Photo Box -->
      <div style="width:130px; height:130px; border-radius:50%; border:4px solid #ffffff; overflow:hidden; margin:80px auto 15px; z-index:2; position:relative; background:#ffffff; box-shadow:0 4px 6px rgba(0,0,0,0.1); box-sizing:border-box; flex-shrink:0;">
        ${photoHtml}
      </div>

      <!-- Text Fields Section -->
      <div style="padding:0 24px; display:flex; flex-direction:column; gap:12px; z-index:2; position:relative; box-sizing:border-box; width:100%; margin-bottom:55px;">
        <!-- الاسم -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:rtl;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:right; white-space:nowrap; flex-shrink:0;">الاسم :</span>
          <span style="font-size:13px; font-weight:700; color:#1e293b; text-align:left; flex-grow:1; direction:rtl; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${employee.name}</span>
        </div>

        ${employee.english_name ? `
        <!-- الاسم الانجليزي -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:ltr;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:left; white-space:nowrap; flex-shrink:0;">Name:</span>
          <span style="font-size:13px; font-weight:700; color:#1e293b; text-align:right; flex-grow:1; direction:ltr; padding-left:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-transform:uppercase;">${employee.english_name}</span>
        </div>
        ` : ''}
        
        <!-- الرقم الوظيفي -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:rtl;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:right; white-space:nowrap; flex-shrink:0;">الرقم الوظيفي :</span>
          <span style="font-size:14px; font-weight:800; color:#1e293b; text-align:left; flex-grow:1; direction:rtl; padding-right:12px; font-family:monospace;">${employee.employee_number || "—"}</span>
        </div>

        <!-- الادارة -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:rtl;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:right; white-space:nowrap; flex-shrink:0;">الإدارة :</span>
          <span style="font-size:12.5px; font-weight:700; color:#1e293b; text-align:left; flex-grow:1; direction:rtl; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${employee.department || "—"}</span>
        </div>

        ${employee.section ? `
        <!-- القسم -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:rtl;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:right; white-space:nowrap; flex-shrink:0;">القسم :</span>
          <span style="font-size:12.5px; font-weight:700; color:#1e293b; text-align:left; flex-grow:1; direction:rtl; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${employee.section || "—"}</span>
        </div>
        ` : ''}

        <!-- الوظيفة -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; width:100%; box-sizing:border-box; direction:rtl;">
          <span style="font-size:12px; font-weight:800; color:${primaryColor}; text-align:right; white-space:nowrap; flex-shrink:0;">الوظيفة :</span>
          <span style="font-size:12.5px; font-weight:700; color:#1e293b; text-align:left; flex-grow:1; direction:rtl; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${employee.job_title || "—"}</span>
        </div>
      </div>

      <!-- Footer Banner -->
      <div style="background:${primaryColor}; height:45px; width:100%; position:absolute; bottom:0; left:0; z-index:1; display:flex; align-items:center; justify-content:center;">
        <div style="color:#ffffff; font-size:13px; font-weight:700; font-family:'Segoe UI',sans-serif; letter-spacing:0.5px;">
          ${websiteText}
        </div>
      </div>

    </div>
  `;
}

/**
 * Build the back-side HTML with QR Code.
 */
function buildBackHtml(employee: Employee, publicUrl: string, qrDataUrl: string, opts: CardOptions): string {
  const expiryStr = formatExpiryDate(opts.expiryDate || employee.expiry_date);
  const companyName = opts.companyName || "الجهاز الوطني للتنمية";
  const websiteText = opts.websiteText || "www.nda.ly";
  const instructionsLines = (opts.backInstructions || "حامل هذا التعريف تابع للجهاز الوطني للتنمية\nيرجى تسهيل مهامه").split('\n');
  const primaryColor = opts.departmentColor || "#1a5b9c";

  return `
    <div style="width:320px;height:506px;font-family:'Cairo','Segoe UI',sans-serif;direction:rtl;position:relative;overflow:hidden;background:#ffffff;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      
      <!-- Top Banner -->
      <div style="background:${primaryColor}; height:60px; width:100%; position:absolute; top:0; left:0; z-index:1; display:flex; align-items:center; justify-content:center;">
        <div style="color:#ffffff; font-size:13px; font-weight:700; font-family:'Segoe UI',sans-serif; letter-spacing:0.5px;">
          ${websiteText}
        </div>
      </div>

      <!-- Center Elements -->
      <div style="display:flex;flex-direction:column;align-items:center;margin:80px auto 10px;z-index:2;position:relative;width:100%;flex-shrink:0;">
        ${opts.logoUrl ? `<img src="${getFileUrl(opts.logoUrl)}" crossorigin="anonymous" style="width:60px; height:60px; object-fit:contain; margin-bottom:10px;" />` : ''}
        <div style="text-align:center;direction:rtl;margin-bottom:15px;">
          <div style="font-size:18px;font-weight:800;font-family:'Cairo',sans-serif;color:${primaryColor};line-height:1.2;">${companyName}</div>
        </div>

        <!-- QR Code centered frame -->
        <div style="width:130px;height:130px;border:3.5px solid ${primaryColor};border-radius:12px;background:#ffffff;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-sizing:border-box;padding:4px;">
          <img src="${qrDataUrl}" width="100%" height="100%" style="display:block;border-radius:8px;" />
        </div>

        <!-- Instructions text -->
        <div style="color:#475569; border-radius:10px; padding:10px 15px; width:280px; margin:0 auto; text-align:center; box-sizing:border-box; direction:rtl; font-size:11.5px; font-weight:600; line-height:1.6; font-family:'Cairo',sans-serif;">
          ${instructionsLines.map(l => `<div>${l}</div>`).join('')}
        </div>
      </div>

      <!-- Bottom Banner -->
      <div style="background:${primaryColor}; height:45px; width:100%; position:absolute; bottom:0; left:0; z-index:1; display:flex; align-items:center; justify-content:center;">
        <div style="color:#ffffff; font-size:13px; font-weight:700; font-family:'Cairo',sans-serif; direction:rtl; letter-spacing:0.2px;">
          تاريخ الانتهاء: <span style="font-family:'Segoe UI',sans-serif;">${expiryStr}</span>
        </div>
      </div>

    </div>
  `;
}

/**
 * Generate a QR code as a data URL by rendering QRCodeCanvas temporarily.
 */
async function generateQRDataUrl(url: string): Promise<string> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  const { QRCodeCanvas } = await import("qrcode.react");
  const React = await import("react");
  const ReactDOM = await import("react-dom/client");

  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(QRCodeCanvas, {
      value: url,
      size: 320,
      level: "H",
      includeMargin: false,
    })
  );

  await new Promise((r) => setTimeout(r, 300));
  const canvas = container.querySelector("canvas");
  const dataUrl = canvas?.toDataURL("image/png") || "";
  root.unmount();
  document.body.removeChild(container);
  return dataUrl;
}

/**
 * Render an HTML card side to a canvas using html-to-image.
 * This guarantees perfect vector rendering, proper RTL support, and gorgeous Arabic text shaping.
 */
async function renderCardSide(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for all fonts in the document (including Cairo) to be loaded
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  // Allow browser time to render cursive scripts and fetch local/CORS images
  await new Promise((r) => setTimeout(r, 600));

  const target = container.querySelector("div > div") as HTMLElement || container.firstElementChild as HTMLElement;
  
  // Use toCanvas from html-to-image for flawless native rendering
  const canvas = await htmlToImage.toCanvas(target, {
    pixelRatio: 3, // scale up for high-definition print quality
    backgroundColor: null,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    }
  });

  document.body.removeChild(container);
  return canvas;
}

/** Export employee ID card as PDF (2 pages: front + back) */
export async function generateIdCard(employee: Employee, publicUrl: string, opts: CardOptions = {}) {
  const toastId = toast.loading("جارٍ إنشاء ملف PDF...");
  try {
    const qrDataUrl = await generateQRDataUrl(publicUrl);
    const frontHtml = buildFrontHtml(employee, publicUrl, opts);
    const backHtml = buildBackHtml(employee, publicUrl, qrDataUrl, opts);

    const [frontCanvas, backCanvas] = await Promise.all([
      renderCardSide(frontHtml),
      renderCardSide(backHtml),
    ]);

    // Standard portrait Credit Card size: 54mm × 85.6mm
    const cardW = 54;
    const cardH = 85.6;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [cardW, cardH] });

    // Front
    pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, cardW, cardH);

    // Back
    pdf.addPage([cardW, cardH], "portrait");
    pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, cardW, cardH);

    pdf.save(`بطاقة-${employee.name}.pdf`);
    toast.success("تم تحميل البطاقة", { id: toastId });
  } catch (err) {
    console.error("ID card PDF error:", err);
    toast.error("فشل إنشاء البطاقة", { id: toastId });
  }
}

/** Export employee ID card as PNG image (front + back stacked) */
export async function generateIdCardImage(employee: Employee, publicUrl: string, opts: CardOptions = {}) {
  const toastId = toast.loading("جارٍ إنشاء الصورة...");
  try {
    const qrDataUrl = await generateQRDataUrl(publicUrl);
    const frontHtml = buildFrontHtml(employee, publicUrl, opts);
    const backHtml = buildBackHtml(employee, publicUrl, qrDataUrl, opts);

    const [frontCanvas, backCanvas] = await Promise.all([
      renderCardSide(frontHtml),
      renderCardSide(backHtml),
    ]);

    // Combine front + back vertically with a gap
    const gap = 30;
    const combined = document.createElement("canvas");
    combined.width = Math.max(frontCanvas.width, backCanvas.width);
    combined.height = frontCanvas.height + gap + backCanvas.height;
    const ctx = combined.getContext("2d")!;

    // Transparent background
    ctx.clearRect(0, 0, combined.width, combined.height);

    // Center each card
    const frontX = (combined.width - frontCanvas.width) / 2;
    const backX = (combined.width - backCanvas.width) / 2;
    ctx.drawImage(frontCanvas, frontX, 0);
    ctx.drawImage(backCanvas, backX, frontCanvas.height + gap);

    combined.toBlob((blob) => {
      if (!blob) {
        toast.error("فشل إنشاء الصورة", { id: toastId });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `بطاقة-${employee.name}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تحميل صورة البطاقة", { id: toastId });
    }, "image/png");
  } catch (err) {
    console.error("ID card image error:", err);
    toast.error("فشل إنشاء صورة البطاقة", { id: toastId });
  }
}

/** Export multiple employee ID cards as a single PDF (2 pages per employee: front + back) */
export async function generateBatchIdCards(
  employees: Employee[],
  getPublicUrl: (id: string) => string,
  getOpts?: (emp: Employee) => CardOptions
) {
  if (employees.length === 0) return;
  const toastId = toast.loading(`جارٍ إنشاء ${employees.length} بطاقة...`);
  try {
    // Standard portrait Credit Card size: 54mm × 85.6mm
    const cardW = 54;
    const cardH = 85.6;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [cardW, cardH] });

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const publicUrl = getPublicUrl(emp.id);
      const opts = getOpts?.(emp) || {};

      toast.loading(`جارٍ إنشاء بطاقة ${i + 1} من ${employees.length}...`, { id: toastId });

      const qrDataUrl = await generateQRDataUrl(publicUrl);
      const frontHtml = buildFrontHtml(emp, publicUrl, opts);
      const backHtml = buildBackHtml(emp, publicUrl, qrDataUrl, opts);

      const [frontCanvas, backCanvas] = await Promise.all([
        renderCardSide(frontHtml),
        renderCardSide(backHtml),
      ]);

      if (i > 0) pdf.addPage([cardW, cardH], "portrait");
      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, cardW, cardH);

      pdf.addPage([cardW, cardH], "portrait");
      pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, cardW, cardH);
    }

    pdf.save(`بطاقات-موظفين-${employees.length}.pdf`);
    toast.success(`تم تحميل ${employees.length} بطاقة بنجاح`, { id: toastId });
  } catch (err) {
    console.error("Batch ID card error:", err);
    toast.error("فشل إنشاء البطاقات", { id: toastId });
  }
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = reject;
    img.src = url;
  });
}


