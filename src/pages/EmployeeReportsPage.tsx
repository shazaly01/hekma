import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/reports/PaginationControls";
import { useAllEmployees } from "@/hooks/useEmployees";
import { useDepartments, useJobTitles, useNationalities } from "@/hooks/useSettings";
import { Badge } from "@/components/ui/badge";
import { UserX, FileDown, FileSpreadsheet, Search } from "lucide-react";
import { exportExcel } from "@/lib/exportExcel";
import { exportPdf, buildPdfHtml } from "@/lib/exportPdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange, fmtDate } from "@/lib/reportUtils";
import { DateRangePicker, FilterSelect, FiltersPanel } from "@/components/reports/ReportComponents";

export default function EmployeeReportsPage() {
  const { data: employees = [] } = useAllEmployees();
  const { data: deptList = [] } = useDepartments();
  const { data: jobList = [] } = useJobTitles();
  const { data: natList = [] } = useNationalities();

  const [empDateRange, setEmpDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [empFilterDept, setEmpFilterDept] = useState("all");
  const [empFilterJob, setEmpFilterJob] = useState("all");
  const [empFilterNat, setEmpFilterNat] = useState("all");
  const [empFilterStatus, setEmpFilterStatus] = useState("all");
  const [empSearch, setEmpSearch] = useState("");

  const depts = deptList.map(d => d.name);
  const jobs = jobList.map(j => j.name);
  const nats = natList.map(n => n.name);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchDept = empFilterDept === "all" || e.department === empFilterDept;
      const matchJob = empFilterJob === "all" || e.job_title === empFilterJob;
      const matchNat = empFilterNat === "all" || e.nationality === empFilterNat;
      const matchStatus = empFilterStatus === "all" || e.status === empFilterStatus;
      
      let matchDate = true;
      if (empDateRange?.from) {
        const empD = new Date(e.created_at);
        matchDate = empD >= empDateRange.from;
        if (empDateRange.to) {
          const toEnd = new Date(empDateRange.to);
          toEnd.setHours(23, 59, 59, 999);
          matchDate = matchDate && empD <= toEnd;
        }
      }

      let matchSearch = true;
      if (empSearch) {
        const s = empSearch.toLowerCase();
        matchSearch = (
          (e.name?.toLowerCase().includes(s)) ||
          (e.english_name?.toLowerCase().includes(s)) ||
          (e.employee_number?.toLowerCase().includes(s))
        );
      }

      return matchDept && matchJob && matchNat && matchStatus && matchDate && matchSearch;
    });
  }, [employees, empFilterDept, empFilterJob, empFilterNat, empFilterStatus, empDateRange, empSearch]);

  const activeCount = 
    (empFilterDept !== "all" ? 1 : 0) + 
    (empFilterJob !== "all" ? 1 : 0) +
    (empFilterNat !== "all" ? 1 : 0) +
    (empFilterStatus !== "all" ? 1 : 0) +
    (empDateRange?.from ? 1 : 0) +
    (empSearch ? 1 : 0);

  const clearFilters = () => {
    setEmpDateRange({ from: undefined, to: undefined });
    setEmpFilterDept("all");
    setEmpFilterJob("all");
    setEmpFilterNat("all");
    setEmpFilterStatus("all");
    setEmpSearch("");
  };

  const printDate = fmtDate(new Date());

  const buildFiltersText = () => {
    const parts: string[] = [];
    if (empDateRange.from || empDateRange.to)
      parts.push(`تاريخ التسجيل: ${empDateRange.from ? fmtDate(empDateRange.from) : "—"} — ${empDateRange.to ? fmtDate(empDateRange.to) : "—"}`);
    if (empFilterDept !== "all") parts.push(`الإدارة: ${empFilterDept}`);
    if (empFilterJob !== "all") parts.push(`الوظيفة: ${empFilterJob}`);
    if (empFilterNat !== "all") parts.push(`الجنسية: ${empFilterNat}`);
    if (empFilterStatus !== "all") parts.push(`الحالة: ${empFilterStatus === "active" ? "نشط" : "موقوف"}`);
    return parts.length > 0 ? parts.join(" | ") : "جميع البيانات";
  };

  const activeEmps = filteredEmployees.filter(e => e.status === "active");
  const suspendedEmps = filteredEmployees.filter(e => e.status === "suspended");

  const { page, setPage, totalPages, paginatedItems, totalItems, pageSize } = usePagination(filteredEmployees);

  const exportPDF = () => {
    const buildRows = (list: any[], badgeClass: string, label: string) =>
      list.map((e: any) => `<tr>
        <td>${e.name}</td><td>${e.employee_number || "—"}</td>
        <td>${e.department || "—"}</td><td>${e.job_title || "—"}</td>
        <td>${e.nationality || "—"}</td><td><span class="${badgeClass}">${label}</span></td>
      </tr>`).join("");
    const statBoxes = [
      { num: filteredEmployees.length, lbl: "إجمالي الموظفين" },
      { num: activeEmps.length, lbl: "موظفون نشطون" },
      { num: suspendedEmps.length, lbl: "موظفون موقوفون" },
    ].map(s => `<div class="stat-box"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join("");
    const body = `
      <div class="page-header">
        <div><h1>تقارير الموظفين</h1></div>
        <div class="stamp">تاريخ الطباعة: ${printDate}</div>
      </div>
      <div class="filters-bar">${buildFiltersText()}</div>
      <div class="stats-row">${statBoxes}</div>
      <table><thead><tr><th>اسم الموظف</th><th>الرقم الوظيفي</th><th>الإدارة</th><th>المسمى الوظيفي</th><th>الجنسية</th><th>الحالة</th></tr></thead>
      <tbody>${buildRows(activeEmps, "badge-green", "نشط")}${buildRows(suspendedEmps, "badge-red", "موقوف")}</tbody></table>
      <div class="footer">نظام إدارة بطاقات الموظفين</div>`;
    exportPdf(buildPdfHtml(body), "تقارير_الموظفين");
  };

  const empCols = [
    { header: "اسم الموظف", render: (e: any) => e.name || "—" },
    { header: "الرقم الوظيفي", render: (e: any) => e.employee_number || "—" },
    { header: "الإدارة", render: (e: any) => e.department || "—" },
    { header: "المسمى الوظيفي", render: (e: any) => e.job_title || "—" },
    { header: "الجنسية", render: (e: any) => e.nationality || "—" },
    { header: "الحالة", render: (e: any) => e.status === "active" ? "نشط" : "موقوف" },
  ];

  const exportEmployeesExcel = () => exportExcel("تقرير_الموظفين", filteredEmployees, empCols, "الموظفين");

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">تقارير الموظفين</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount > 0 ? `${activeCount} فلتر نشط` : "عرض جميع البيانات"}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button onClick={exportEmployeesExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel
            </Button>
            <Button onClick={exportPDF} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <FileDown className="w-4 h-4" />
              طباعة التقرير PDF
            </Button>
          </div>
        </div>

        <FiltersPanel
          title="فلاتر الموظفين"
          activeCount={activeCount}
          onClear={clearFilters}
        >
          <div className="relative col-span-full sm:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم الوظيفي..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="pr-10 bg-background"
            />
          </div>
          <DateRangePicker value={empDateRange} onChange={setEmpDateRange} label="تاريخ التسجيل" />
          <FilterSelect value={empFilterDept} onChange={setEmpFilterDept} options={depts} placeholder="الإدارة" />
          <FilterSelect value={empFilterJob} onChange={setEmpFilterJob} options={jobs} placeholder="الوظيفة" />
          <FilterSelect value={empFilterNat} onChange={setEmpFilterNat} options={nats} placeholder="الجنسية" />
          <Select value={empFilterStatus} onValueChange={setEmpFilterStatus}>
            <SelectTrigger className="h-9 text-sm min-w-[120px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
            </SelectContent>
          </Select>
        </FiltersPanel>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي الموظفين", value: filteredEmployees.length, cls: "text-foreground" },
            { label: "نشطون", value: activeEmps.length, cls: "text-success" },
            { label: "موقوفون", value: suspendedEmps.length, cls: "text-destructive" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 text-center shadow-sm">
              <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Employee List */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">قائمة الموظفين</h2>
            <Badge variant="secondary">{filteredEmployees.length}</Badge>
          </div>
          <div className="space-y-2">
            {filteredEmployees.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات</p>
              : paginatedItems.map((emp) => (
                <div key={emp.id} className={cn("flex items-center justify-between p-3 rounded-lg", emp.status === "suspended" ? "bg-destructive/5" : "bg-success/5")}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.job_title || "—"} | {emp.department || "—"} | {emp.nationality || "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground font-mono" dir="ltr">{emp.employee_number || "—"}</span>
                    <Badge className={emp.status === "suspended" ? "bg-destructive/10 text-destructive text-[10px]" : "bg-success/10 text-success text-[10px]"}>
                      {emp.status === "suspended" ? "موقوف" : "نشط"}
                    </Badge>
                  </div>
                </div>
              ))
            }
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      </div>
    </DashboardLayout>
  );
}
