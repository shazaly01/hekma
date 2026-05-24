import { useMemo, useState } from "react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/reports/PaginationControls";
import { exportExcel } from "@/lib/exportExcel";
import { exportPdf, buildPdfHtml } from "@/lib/exportPdf";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDepartments, useJobTitles, useNationalities } from "@/hooks/useSettings";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, FileDown, AlertTriangle, XCircle,
  BarChart3, CheckCircle, FileText, FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange, fmtDate, printHTML, printStyles } from "@/lib/reportUtils";
import { DateRangePicker, FilterSelect, FiltersPanel, ReportSection } from "@/components/reports/ReportComponents";

function useAllCards() {
  return useQuery({
    queryKey: ["all-employee-cards"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await api.get("/reports/all-cards", { params: { offset: from, limit: pageSize } });
        allData.push(...(data as any[]));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });
}

function buildCardRows(data: any[], now: Date) {
  return data.map((c: any) => {
    const isDestroyed = c.is_destroyed;
    const isExpired = c.expiry_date && new Date(c.expiry_date) < now;
    const statusBadge = isDestroyed
      ? `<span class="badge-gray">متلفة</span>`
      : isExpired
      ? `<span class="badge-red">منتهية</span>`
      : `<span class="badge-green">سارية</span>`;
    const issueLabel = c.issue_type === "new" ? "جديد" : c.issue_type === "renewal" ? "تجديد" : "بدل فاقد";
    return `<tr>
      <td>${c.employees?.name || "—"}</td>
      <td>${c.employees?.employee_number || "—"}</td>
      <td>${c.employees?.department || "—"}</td>
      <td>${c.card_types?.name || "—"}</td>
      <td>${issueLabel}</td>
      <td>${fmtDate(c.issue_date)}</td>
      <td>${fmtDate(c.expiry_date)}</td>
      <td>${statusBadge}</td>
    </tr>`;
  }).join("");
}

const cardTableHeaders = `<tr>
  <th>اسم الموظف</th><th>الرقم الوظيفي</th><th>الإدارة</th>
  <th>نوع البطاقة</th><th>نوع الإصدار</th>
  <th>تاريخ الإصدار</th><th>تاريخ الانتهاء</th><th>الحالة</th>
</tr>`;

export default function ReportsPage() {
  const { data: cards = [] } = useAllCards();
  const { data: deptList = [] } = useDepartments();
  const { data: jobList = [] } = useJobTitles();
  const { data: natList = [] } = useNationalities();

  const [cardIssueDateRange, setCardIssueDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [cardExpiryDateRange, setCardExpiryDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [cardFilterDept, setCardFilterDept] = useState("all");
  const [cardFilterJob, setCardFilterJob] = useState("all");
  const [cardFilterNat, setCardFilterNat] = useState("all");
  const [cardFilterIssueType, setCardFilterIssueType] = useState("all");
  const [cardFilterStatus, setCardFilterStatus] = useState("all");

  const now = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (cardIssueDateRange.from || cardIssueDateRange.to) {
        if (!c.issue_date) return false;
        const d = new Date(c.issue_date);
        if (cardIssueDateRange.from && d < cardIssueDateRange.from) return false;
        if (cardIssueDateRange.to) {
          const toEnd = new Date(cardIssueDateRange.to);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
      }
      if (cardExpiryDateRange.from || cardExpiryDateRange.to) {
        if (!c.expiry_date) return false;
        const d = new Date(c.expiry_date);
        if (cardExpiryDateRange.from && d < cardExpiryDateRange.from) return false;
        if (cardExpiryDateRange.to) {
          const toEnd = new Date(cardExpiryDateRange.to);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
      }
      if (cardFilterDept !== "all" && c.employees?.department !== cardFilterDept) return false;
      if (cardFilterJob !== "all" && c.employees?.job_title !== cardFilterJob) return false;
      if (cardFilterNat !== "all" && c.employees?.nationality !== cardFilterNat) return false;
      if (cardFilterIssueType !== "all" && c.issue_type !== cardFilterIssueType) return false;
      if (cardFilterStatus === "active") {
        if (c.is_destroyed || (c.expiry_date && new Date(c.expiry_date) < now)) return false;
      } else if (cardFilterStatus === "expired") {
        if (!c.expiry_date || new Date(c.expiry_date) >= now || c.is_destroyed) return false;
      } else if (cardFilterStatus === "destroyed") {
        if (!c.is_destroyed) return false;
      }
      return true;
    });
  }, [cards, cardIssueDateRange, cardExpiryDateRange, cardFilterDept, cardFilterJob, cardFilterNat, cardFilterIssueType, cardFilterStatus]);

  const cardStats = useMemo(() => {
    const expiredCards = filteredCards.filter(c => c.expiry_date && new Date(c.expiry_date) < now && !c.is_destroyed);
    const soonCards = filteredCards.filter(c => c.expiry_date && new Date(c.expiry_date) >= now && new Date(c.expiry_date) <= in30 && !c.is_destroyed);
    const destroyedCards = filteredCards.filter(c => c.is_destroyed);
    const activeCards = filteredCards.filter(c => !c.is_destroyed && (!c.expiry_date || new Date(c.expiry_date) >= now));
    return {
      expiredCards, soonCards, destroyedCards, activeCards,
      newCount: filteredCards.filter(c => c.issue_type === "new").length,
      renewalCount: filteredCards.filter(c => c.issue_type === "renewal").length,
      replacementCount: filteredCards.filter(c => c.issue_type === "replacement").length,
    };
  }, [filteredCards]);

  const activePag = usePagination(cardStats.activeCards);
  const expiredPag = usePagination(cardStats.expiredCards);
  const soonPag = usePagination(cardStats.soonCards);
  const destroyedPag = usePagination(cardStats.destroyedCards);

  const cardActiveCount = [
    cardIssueDateRange.from || cardIssueDateRange.to,
    cardExpiryDateRange.from || cardExpiryDateRange.to,
    cardFilterDept !== "all",
    cardFilterJob !== "all",
    cardFilterNat !== "all",
    cardFilterIssueType !== "all",
    cardFilterStatus !== "all",
  ].filter(Boolean).length;

  const clearCardFilters = () => {
    setCardIssueDateRange({ from: undefined, to: undefined });
    setCardExpiryDateRange({ from: undefined, to: undefined });
    setCardFilterDept("all"); setCardFilterJob("all"); setCardFilterNat("all");
    setCardFilterIssueType("all"); setCardFilterStatus("all");
  };

  const depts = deptList.map(d => d.name);
  const jobs = jobList.map(j => j.name);
  const nats = natList.map(n => n.name);

  const printDate = fmtDate(new Date());

  const buildCardFiltersText = () => {
    const parts: string[] = [];
    if (cardIssueDateRange.from || cardIssueDateRange.to)
      parts.push(`تاريخ الإصدار: ${cardIssueDateRange.from ? fmtDate(cardIssueDateRange.from) : "—"} — ${cardIssueDateRange.to ? fmtDate(cardIssueDateRange.to) : "—"}`);
    if (cardExpiryDateRange.from || cardExpiryDateRange.to)
      parts.push(`تاريخ الانتهاء: ${cardExpiryDateRange.from ? fmtDate(cardExpiryDateRange.from) : "—"} — ${cardExpiryDateRange.to ? fmtDate(cardExpiryDateRange.to) : "—"}`);
    if (cardFilterDept !== "all") parts.push(`الإدارة: ${cardFilterDept}`);
    if (cardFilterJob !== "all") parts.push(`الوظيفة: ${cardFilterJob}`);
    if (cardFilterNat !== "all") parts.push(`الجنسية: ${cardFilterNat}`);
    if (cardFilterIssueType !== "all") parts.push(`نوع الإصدار: ${cardFilterIssueType === "new" ? "جديد" : cardFilterIssueType === "renewal" ? "تجديد" : "بدل فاقد"}`);
    return parts.length > 0 ? parts.join(" | ") : "جميع البيانات";
  };

  const exportXLS = (filename: string, data: any[], columns: { header: string; render: (c: any) => string }[]) => {
    exportExcel(filename, data, columns);
  };

  const commonCols = (extra: { header: string; render: (c: any) => string }[] = []) => [
    { header: "اسم الموظف", render: (c: any) => c.employees?.name || "—" },
    { header: "الرقم الوظيفي", render: (c: any) => c.employees?.employee_number || "—" },
    { header: "الإدارة", render: (c: any) => c.employees?.department || "—" },
    { header: "نوع البطاقة", render: (c: any) => c.card_types?.name || "—" },
    ...extra,
  ];

  const issueCols = commonCols([
    { header: "نوع الإصدار", render: (c: any) => c.issue_type === "new" ? "جديد" : c.issue_type === "renewal" ? "تجديد" : "بدل فاقد" },
    { header: "تاريخ الإصدار", render: (c: any) => fmtDate(c.issue_date) },
    { header: "تاريخ الانتهاء", render: (c: any) => fmtDate(c.expiry_date) },
  ]);

  const expiryCols = commonCols([
    { header: "تاريخ الإصدار", render: (c: any) => fmtDate(c.issue_date) },
    { header: "تاريخ الانتهاء", render: (c: any) => fmtDate(c.expiry_date) },
  ]);

  const destroyCols = commonCols([
    { header: "سبب التلف", render: (c: any) => c.destruction_reasons?.name || "—" },
    { header: "تاريخ التلف", render: (c: any) => fmtDate(c.destruction_date) },
  ]);

  const allCols = commonCols([
    { header: "نوع الإصدار", render: (c: any) => c.issue_type === "new" ? "جديد" : c.issue_type === "renewal" ? "تجديد" : "بدل فاقد" },
    { header: "تاريخ الإصدار", render: (c: any) => fmtDate(c.issue_date) },
    { header: "تاريخ الانتهاء", render: (c: any) => fmtDate(c.expiry_date) },
    { header: "الحالة", render: (c: any) => c.is_destroyed ? "متلفة" : (c.expiry_date && new Date(c.expiry_date) < now ? "منتهية" : "سارية") },
  ]);

  const buildSectionPrint = (title: string, data: any[], columns: { header: string; render: (c: any) => string }[]) => {
    const body = `
      <div class="page-header">
        <div><h1>${title}</h1><p>نظام إدارة بطاقات الموظفين</p></div>
        <div class="stamp">تاريخ الطباعة: ${printDate}<br/>العدد: ${data.length}</div>
      </div>
      <div class="filters-bar">${buildCardFiltersText()}</div>
      <table><thead><tr>${columns.map(c => `<th>${c.header}</th>`).join("")}</tr></thead>
      <tbody>${data.map(c => `<tr>${columns.map(col => `<td>${col.render(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <div class="footer">نظام إدارة بطاقات الموظفين — تقرير آلي</div>`;
    exportPdf(buildPdfHtml(body), title);
  };

  const printActiveCards = () => buildSectionPrint(`البطاقات السارية (${cardStats.activeCards.length})`, cardStats.activeCards, issueCols);
  const printExpiredCards = () => buildSectionPrint(`البطاقات المنتهية (${cardStats.expiredCards.length})`, cardStats.expiredCards, expiryCols);
  const printSoonCards = () => buildSectionPrint(`بطاقات تنتهي خلال 30 يوم (${cardStats.soonCards.length})`, cardStats.soonCards, expiryCols);
  const printDestroyedCards = () => buildSectionPrint(`البطاقات المتلفة (${cardStats.destroyedCards.length})`, cardStats.destroyedCards, destroyCols);

  const exportActiveExcel = () => exportXLS("البطاقات_السارية", cardStats.activeCards, issueCols);
  const exportExpiredExcel = () => exportXLS("البطاقات_المنتهية", cardStats.expiredCards, expiryCols);
  const exportSoonExcel = () => exportXLS("بطاقات_تنتهي_قريبا", cardStats.soonCards, expiryCols);
  const exportDestroyedExcel = () => exportXLS("البطاقات_المتلفة", cardStats.destroyedCards, destroyCols);
  const exportAllExcel = () => exportXLS("جميع_البطاقات", filteredCards, allCols);

  const exportFullPDF = () => {
    const statBoxes = [
      { num: filteredCards.length, lbl: "إجمالي البطاقات" },
      { num: cardStats.activeCards.length, lbl: "بطاقات سارية" },
      { num: cardStats.expiredCards.length, lbl: "بطاقات منتهية" },
      { num: cardStats.destroyedCards.length, lbl: "بطاقات متلفة" },
    ].map(s => `<div class="stat-box"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join("");

    const issuedSection = filteredCards.length > 0 ? `
      <div class="section">
        <div class="section-title">البطاقات المُصدَرة (${filteredCards.length})</div>
        <table><thead>${cardTableHeaders}</thead><tbody>${buildCardRows(filteredCards, now)}</tbody></table>
      </div>` : "";

    const destroyedSection = cardStats.destroyedCards.length > 0 ? `
      <div class="section">
        <div class="section-title">البطاقات المتلفة (${cardStats.destroyedCards.length})</div>
        <table><thead><tr><th>اسم الموظف</th><th>الرقم الوظيفي</th><th>الإدارة</th><th>نوع البطاقة</th><th>سبب التلف</th><th>تاريخ التلف</th></tr></thead>
        <tbody>${cardStats.destroyedCards.map((c: any) => `<tr>
          <td>${c.employees?.name || "—"}</td><td>${c.employees?.employee_number || "—"}</td>
          <td>${c.employees?.department || "—"}</td><td>${c.card_types?.name || "—"}</td>
          <td>${c.destruction_reasons?.name || "—"}</td><td>${fmtDate(c.destruction_date)}</td>
        </tr>`).join("")}</tbody></table>
      </div>` : "";

    const body = `
      <div class="page-header">
        <div><h1>تقارير البطاقات — نظام إدارة بطاقات الموظفين</h1></div>
        <div class="stamp">تاريخ الطباعة: ${printDate}</div>
      </div>
      <div class="filters-bar">${buildCardFiltersText()}</div>
      <div class="stats-row">${statBoxes}</div>
      ${issuedSection}${destroyedSection}
      <div class="footer">نظام إدارة بطاقات الموظفين — تقرير آلي</div>`;
    exportPdf(buildPdfHtml(body), "تقارير_البطاقات");
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">تقارير البطاقات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {cardActiveCount > 0 ? `${cardActiveCount} فلتر نشط` : "عرض جميع البيانات"}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={exportAllExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel شامل
            </Button>
            <Button onClick={exportFullPDF} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <FileText className="w-4 h-4" />
              تقرير شامل PDF
            </Button>
          </div>
        </div>

        <FiltersPanel
          title="فلاتر البطاقات"
          activeCount={cardActiveCount}
          onClear={clearCardFilters}
          onPrint={exportFullPDF}
          printLabel="طباعة تقرير البطاقات"
        >
          <DateRangePicker value={cardIssueDateRange} onChange={setCardIssueDateRange} label="تاريخ الإصدار" />
          <DateRangePicker value={cardExpiryDateRange} onChange={setCardExpiryDateRange} label="تاريخ الانتهاء" />
          <FilterSelect value={cardFilterDept} onChange={setCardFilterDept} options={depts} placeholder="الإدارة" />
          <FilterSelect value={cardFilterJob} onChange={setCardFilterJob} options={jobs} placeholder="الوظيفة" />
          <FilterSelect value={cardFilterNat} onChange={setCardFilterNat} options={nats} placeholder="الجنسية" />
          <Select value={cardFilterIssueType} onValueChange={setCardFilterIssueType}>
            <SelectTrigger className="h-9 text-sm min-w-[130px]">
              <SelectValue placeholder="نوع الإصدار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="new">جديد</SelectItem>
              <SelectItem value="renewal">تجديد</SelectItem>
              <SelectItem value="replacement">بدل فاقد</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cardFilterStatus} onValueChange={setCardFilterStatus}>
            <SelectTrigger className="h-9 text-sm min-w-[130px]">
              <SelectValue placeholder="حالة البطاقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">سارية</SelectItem>
              <SelectItem value="expired">منتهية</SelectItem>
              <SelectItem value="destroyed">متلفة</SelectItem>
            </SelectContent>
          </Select>
        </FiltersPanel>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />, value: filteredCards.length, label: "إجمالي البطاقات", cls: "text-accent" },
            { icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, value: cardStats.activeCards.length, label: "سارية", cls: "text-success" },
            { icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />, value: cardStats.expiredCards.length, label: "منتهية", cls: "text-destructive" },
            { icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />, value: cardStats.destroyedCards.length, label: "متلفة", cls: "text-muted-foreground" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 sm:p-4 text-center shadow-sm">
              <div className={cn("flex justify-center mb-1", s.cls)}>{s.icon}</div>
              <p className={cn("text-xl sm:text-2xl font-bold", s.cls)}>{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">إحصائيات الإصدار</h2>
            <span className="text-xs text-muted-foreground mr-auto">
              {cardIssueDateRange.from || cardIssueDateRange.to
                ? `${cardIssueDateRange.from ? fmtDate(cardIssueDateRange.from) : "—"} — ${cardIssueDateRange.to ? fmtDate(cardIssueDateRange.to) : "—"}`
                : "جميع الفترات"}
              {cardFilterDept !== "all" ? ` | ${cardFilterDept}` : ""}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "إصدار جديد", value: cardStats.newCount, cls: "bg-accent/10 text-accent" },
              { label: "تجديد", value: cardStats.renewalCount, cls: "bg-primary/10 text-primary" },
              { label: "بدل فاقد", value: cardStats.replacementCount, cls: "bg-warning/10 text-warning" },
            ].map((s, i) => (
              <div key={i} className={cn("p-4 rounded-xl", s.cls)}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-1 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <ReportSection
          icon={<CheckCircle className="w-5 h-5 text-success" />}
          title="البطاقات السارية"
          count={cardStats.activeCards.length}
          emptyMsg="لا توجد بطاقات سارية في النطاق المحدد"
          onPrint={printActiveCards}
          onExcel={exportActiveExcel}
        >
          {activePag.paginatedItems.map((c: any) => <CardRow key={c.id} card={c} now={now} />)}
          <PaginationControls page={activePag.page} totalPages={activePag.totalPages} onPageChange={activePag.setPage} totalItems={activePag.totalItems} pageSize={activePag.pageSize} />
        </ReportSection>

        <ReportSection
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          title="البطاقات المنتهية"
          count={cardStats.expiredCards.length}
          emptyMsg="لا توجد بطاقات منتهية في النطاق المحدد"
          onPrint={printExpiredCards}
          onExcel={exportExpiredExcel}
        >
          {expiredPag.paginatedItems.map((c: any) => <CardRow key={c.id} card={c} now={now} />)}
          <PaginationControls page={expiredPag.page} totalPages={expiredPag.totalPages} onPageChange={expiredPag.setPage} totalItems={expiredPag.totalItems} pageSize={expiredPag.pageSize} />
        </ReportSection>

        {cardStats.soonCards.length > 0 && (
          <ReportSection
            icon={<CreditCard className="w-5 h-5 text-warning" />}
            title="بطاقات تنتهي خلال 30 يوم"
            count={cardStats.soonCards.length}
            onPrint={printSoonCards}
            onExcel={exportSoonExcel}
          >
            {soonPag.paginatedItems.map((c: any) => <CardRow key={c.id} card={c} now={now} />)}
            <PaginationControls page={soonPag.page} totalPages={soonPag.totalPages} onPageChange={soonPag.setPage} totalItems={soonPag.totalItems} pageSize={soonPag.pageSize} />
          </ReportSection>
        )}

        <ReportSection
          icon={<XCircle className="w-5 h-5 text-muted-foreground" />}
          title="البطاقات المتلفة"
          count={cardStats.destroyedCards.length}
          emptyMsg="لا توجد بطاقات متلفة في النطاق المحدد"
          onPrint={printDestroyedCards}
          onExcel={exportDestroyedExcel}
        >
          {destroyedPag.paginatedItems.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-sm font-medium text-foreground">{c.employees?.name}</p>
                <p className="text-xs text-muted-foreground">{c.employees?.department || "—"} — {c.card_types?.name} — سبب التلف: {c.destruction_reasons?.name || "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{fmtDate(c.destruction_date)}</span>
            </div>
          ))}
          <PaginationControls page={destroyedPag.page} totalPages={destroyedPag.totalPages} onPageChange={destroyedPag.setPage} totalItems={destroyedPag.totalItems} pageSize={destroyedPag.pageSize} />
        </ReportSection>
      </div>
    </DashboardLayout>
  );
}

function CardRow({ card: c, now }: { card: any; now: Date }) {
  const isExpired = c.expiry_date && new Date(c.expiry_date) < now;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div>
        <p className="text-sm font-medium text-foreground">{c.employees?.name}</p>
        <p className="text-xs text-muted-foreground">
          {c.card_types?.name} — {c.employees?.department || "—"} |{" "}
          {c.issue_type === "new" ? "جديد" : c.issue_type === "renewal" ? "تجديد" : "بدل فاقد"}
        </p>
      </div>
      <div className="text-left">
        <span className={cn("text-xs font-medium block", isExpired ? "text-destructive" : "text-warning")}>
          {fmtDate(c.expiry_date)}
        </span>
        <span className="text-xs text-muted-foreground">إصدار: {fmtDate(c.issue_date)}</span>
      </div>
    </div>
  );
}
