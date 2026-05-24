import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments, useNationalities } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { useCardTypesAdmin } from "@/hooks/useCards";
import { hasPermission, permissions } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Search, X, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, CheckSquare, Square, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getFileUrl } from "@/lib/utils";
import ExcelImportDialog from "@/components/employees/ExcelImportDialog";
import { generateBatchIdCards } from "@/components/employees/EmployeeIdCard";
import { useQueryClient } from "@tanstack/react-query";
import { EmployeeGridSkeleton } from "@/components/ui/loading-skeletons";
import type { Tables } from "@/integrations/supabase/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Employee = Tables<"employees">;

export default function EmployeeListPage() {
  const { role } = useAuth();
  const canCreate = hasPermission(role, permissions.employeeCreate);
  const canImport = hasPermission(role, permissions.employeeImportExcel);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [nationality, setNationality] = useState("all");
  const [status, setStatus] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: departments = [] } = useDepartments();
  const { data: nationalities = [] } = useNationalities();
  const { data: cardTypes = [] } = useCardTypesAdmin();
  const queryClient = useQueryClient();
  const activeDept = department === "all" ? undefined : department;
  const { data, isLoading } = useEmployees(search, activeDept, undefined, page);

  const allEmployees = data?.employees ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageSize = data?.pageSize ?? 12;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const employees = allEmployees.filter((emp) => {
    // Status filter
    if (status !== "all" && emp.status !== status) return false;
    // Nationality filter
    if (nationality !== "all" && emp.nationality !== nationality) return false;
    // Expiry filter
    if (expiryFilter !== "all") {
      if (!emp.expiry_date) return expiryFilter === "none";
      const expiry = new Date(emp.expiry_date);
      const now = new Date();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      if (expiryFilter === "expired") return expiry < now;
      if (expiryFilter === "soon") return expiry >= now && expiry <= in30;
      if (expiryFilter === "valid") return expiry > in30;
    }
    return true;
  });

  const hasFilters = search || department !== "all" || expiryFilter !== "all" || nationality !== "all" || status !== "all";
  const advancedFilterCount = [nationality !== "all", status !== "all", expiryFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setDepartment("all");
    setNationality("all");
    setStatus("all");
    setExpiryFilter("all");
    setPage(1);
  };

  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };
  const handleDeptChange = (val: string) => { setDepartment(val); setPage(1); };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchPrint = async () => {
    const selected = employees.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) return;
    setPrinting(true);
    try {
      await generateBatchIdCards(
        selected,
        (id) => `${window.location.origin}/employee/${id}`,
        (emp) => {
          const deptColor = departments.find(d => d.name === emp.department)?.color;
          const cardType = (cardTypes as any[])?.find((c: any) => c.id === (emp as any).active_card_type_id) || (cardTypes as any[])?.[0];
          return {
            logoUrl: cardType?.logo_url || null,
            cardTypeName: cardType?.name || null,
            expiryDate: emp.expiry_date || null,
            issueDate: (emp as any).issue_date || null,
            websiteText: cardType?.website_text || null,
            backInstructions: cardType?.back_instructions || null,
            cardTitle: cardType?.card_title || null,
            companyName: cardType?.company_name || null,
            departmentColor: deptColor || null,
          };
        }
      );
    } finally {
      setPrinting(false);
    }
  };

  const allSelected = employees.length > 0 && selectedIds.size === employees.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">قائمة الموظفين</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} موظف</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto flex-wrap">
            {!selectMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setSelectMode(true)} disabled={employees.length === 0}>
                  <CheckSquare className="w-4 h-4 ml-1" />
                  اختيار متعدد
                </Button>
                {canImport && (
                  <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                    <FileSpreadsheet className="w-4 h-4 ml-1" />
                    <span className="hidden xs:inline">استيراد</span> Excel
                  </Button>
                )}
                {canCreate && (
                  <Link
                    to="/dashboard/employees/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    إضافة موظف
                  </Link>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {allSelected ? <Square className="w-4 h-4 ml-1" /> : <CheckSquare className="w-4 h-4 ml-1" />}
                  {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                </Button>
                <Button
                  size="sm"
                  className="gradient-primary text-primary-foreground"
                  onClick={handleBatchPrint}
                  disabled={selectedIds.size === 0 || printing}
                >
                  <Printer className="w-4 h-4 ml-1" />
                  {printing ? "جارٍ الطباعة..." : `طباعة ${selectedIds.size} بطاقة`}
                </Button>
                <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search & Basic Filter */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الرقم الوظيفي أو الجواز..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            <div className="min-w-[140px]">
              <Select value={department} onValueChange={handleDeptChange}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الإدارات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الإدارات</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={advancedFilterCount > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              فلاتر متقدمة
              {advancedFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 ml-1" />
                مسح
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-wrap gap-3 items-end">
                <div className="min-w-[140px]">
                  <label className="text-xs text-muted-foreground mb-1.5 block">الجنسية</label>
                  <Select value={nationality} onValueChange={(v) => { setNationality(v); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="كل الجنسيات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الجنسيات</SelectItem>
                      {nationalities.map((n) => (
                        <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[130px]">
                  <label className="text-xs text-muted-foreground mb-1.5 block">الحالة</label>
                  <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="كل الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="active">مستمر</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <label className="text-xs text-muted-foreground mb-1.5 block">صلاحية البطاقة</label>
                  <Select value={expiryFilter} onValueChange={(v) => { setExpiryFilter(v); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="expired">منتهية</SelectItem>
                      <SelectItem value="soon">تنتهي خلال 30 يوم</SelectItem>
                      <SelectItem value="valid">سارية</SelectItem>
                      <SelectItem value="none">بدون تاريخ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {isLoading ? (
          <EmployeeGridSkeleton count={8} />
        ) : employees.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-border">
            <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{hasFilters ? "لا توجد نتائج مطابقة" : "لا يوجد موظفون بعد"}</p>
          {!hasFilters && canCreate && (
              <Link to="/dashboard/employees/new" className="text-sm text-accent hover:underline mt-2 inline-block">
                أضف أول موظف
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                const CardWrapper = selectMode ? "div" : Link;
                const cardProps = selectMode
                  ? {
                      onClick: () => toggleSelect(emp.id),
                      className: `bg-card rounded-xl shadow-card border-2 p-5 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-elevated"
                          : "border-border hover:border-muted-foreground/30"
                      }`,
                    }
                  : {
                      to: `/dashboard/employees/${emp.id}`,
                      className: "bg-card rounded-xl shadow-card border border-border p-5 hover:shadow-elevated transition-shadow group",
                    };

                return (
                  <CardWrapper key={emp.id} {...(cardProps as any)}>
                    <div className="flex items-start gap-4">
                      {selectMode && (
                        <div className="pt-1 shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(emp.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                      )}
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                        {emp.photo_url ? (
                          <img src={getFileUrl(emp.photo_url)} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          emp.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                          {emp.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{emp.job_title || emp.department || "—"}</p>
                        {emp.nationality && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{emp.nationality}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={emp.status === "active" ? "status-active text-xs" : "status-suspended text-xs"}>
                            {emp.status === "active" ? "مستمر" : "موقوف"}
                          </Badge>
                          <span className="text-xs text-muted-foreground" dir="ltr">{emp.employee_number || ""}</span>
                        </div>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["employees"] })}
        />
    </DashboardLayout>
  );
}
