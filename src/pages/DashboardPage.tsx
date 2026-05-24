import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments, useSections } from "@/hooks/useSettings";
import { useDashboardStats, useExpiryAlerts } from "@/hooks/useDashboardStats";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserCheck, UserX, CreditCard, Eye, ShieldCheck, Trash2, CalendarClock, UserPlus as UserPlusIcon, TrendingUp, BarChart3 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { TableRowsSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(24 95% 53%)",
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [page, setPage] = useState(1);

  // Aggregate stats from DB (no full data fetch)
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: expiryAlerts = [] } = useExpiryAlerts();

  // Paginated employee list for the table
  const { data: empData, isLoading } = useEmployees(search, department === "all" ? "" : department, section === "all" ? "" : section, page);
  const { data: deptsData = [] } = useDepartments();
  const departments = deptsData.map(d => d.name);

  const { data: allSections = [] } = useSections();
  const selectedDeptId = deptsData.find(d => d.name === department)?.id;
  const availableSections = allSections.filter(s => s.department_id === selectedDeptId);

  const employees = empData?.employees || [];
  const totalCount = empData?.totalCount || 0;
  const pageSize = empData?.pageSize || 12;
  const totalPages = Math.ceil(totalCount / pageSize);

  const now = new Date();

  const deptChartData = stats?.dept_distribution || [];
  const natChartData = stats?.nat_distribution || [];

  const cardChartData = stats ? [
    { name: "سارية", value: stats.valid_cards },
    { name: "منتهية", value: stats.expired_cards },
    { name: "متلفة", value: stats.destroyed_cards },
  ].filter((d) => d.value > 0) : [];

  const cardChartConfig = {
    سارية: { label: "سارية", color: "hsl(142 76% 36%)" },
    منتهية: { label: "منتهية", color: "hsl(38 92% 50%)" },
    متلفة: { label: "متلفة", color: "hsl(0 84% 60%)" },
  };

  const deptChartConfig = Object.fromEntries(
    deptChartData.map((d, i) => [d.name, { label: d.name, color: CHART_COLORS[i % CHART_COLORS.length] }])
  );

  const natChartConfig = Object.fromEntries(
    natChartData.map((d, i) => [d.name, { label: d.name, color: CHART_COLORS[(i + 3) % CHART_COLORS.length] }])
  );

  const statCards = [
    { label: "إجمالي الموظفين", value: stats?.total_employees ?? 0, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "مستمرون", value: stats?.active_employees ?? 0, icon: UserCheck, color: "bg-success/10 text-success" },
    { label: "موقوفون", value: stats?.suspended_employees ?? 0, icon: UserX, color: "bg-destructive/10 text-destructive" },
    { label: "بطاقات سارية", value: stats?.valid_cards ?? 0, icon: ShieldCheck, color: "bg-success/10 text-success" },
    { label: "بطاقات منتهية", value: stats?.expired_cards ?? 0, icon: CreditCard, color: "bg-warning/10 text-warning" },
    { label: "بطاقات متلفة", value: stats?.destroyed_cards ?? 0, icon: Trash2, color: "bg-destructive/10 text-destructive" },
    { label: "تنتهي هذا الشهر", value: stats?.expiring_this_month ?? 0, icon: CalendarClock, color: "bg-warning/10 text-warning" },
    { label: "موظفون جدد (الشهر)", value: stats?.new_employees_this_month ?? 0, icon: UserPlusIcon, color: "bg-primary/10 text-primary" },
  ];

  const renewalRate = stats?.card_renewal_rate ?? 0;
  const monthlyCardsData = stats?.monthly_cards || [];

  // Reset page when search/filter changes
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleDept = (val: string) => {
    setDepartment(val);
    setSection("all");
    setPage(1);
  };

  const handleSection = (val: string) => {
    setSection(val);
    setPage(1);
  };

  if (statsLoading) return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة عامة على بيانات الموظفين</p>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl shadow-card border border-border p-4">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
          <div className="bg-card rounded-xl shadow-card border border-border p-4">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full hidden sm:block" />
                <Skeleton className="h-4 w-20 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة عامة على بيانات الموظفين</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-3 sm:p-4 shadow-card border border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {statsLoading ? "—" : stat.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && (stats.total_employees > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deptChartData.length > 0 && (
              <div className="bg-card rounded-xl shadow-card border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">توزيع الموظفين حسب الإدارة</h3>
                <ChartContainer config={deptChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={deptChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {deptChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            )}

            {natChartData.length > 0 && (
              <div className="bg-card rounded-xl shadow-card border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">توزيع الموظفين حسب الجنسية</h3>
                <ChartContainer config={natChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={natChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {natChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            )}

            {cardChartData.length > 0 && (
              <div className="bg-card rounded-xl shadow-card border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">حالات البطاقات</h3>
                <ChartContainer config={cardChartConfig} className="h-[250px] w-full">
                  <BarChart data={cardChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {cardChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={cardChartConfig[entry.name as keyof typeof cardChartConfig]?.color || "hsl(var(--primary))"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            )}

            {/* Monthly Cards Trend */}
            {monthlyCardsData.length > 0 && (
              <div className="bg-card rounded-xl shadow-card border border-border p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">البطاقات المصدرة (آخر 6 أشهر)</h3>
                <ChartContainer config={{ value: { label: "بطاقات", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                  <AreaChart data={monthlyCardsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}

            {/* KPI Cards */}
            <div className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col items-center justify-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h3 className="text-sm font-bold text-foreground">نسبة التجديد</h3>
              <p className="text-4xl font-bold text-primary">{renewalRate}%</p>
              <p className="text-xs text-muted-foreground">من إجمالي {stats?.total_cards ?? 0} بطاقة</p>
            </div>
          </div>
        )}

        {/* Expiry Alerts */}
        <ExpiryAlerts alerts={expiryAlerts} />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الرقم الوظيفي..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={department || "all"} onValueChange={handleDept}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="جميع الإدارات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الإدارات</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {department && department !== "all" && (
            <Select value={section || "all"} onValueChange={handleSection}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {availableSections.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Employee List */}
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right text-xs font-semibold text-muted-foreground p-4">الموظف</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-4 hidden sm:table-cell">الرقم الوظيفي</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-4 hidden md:table-cell">الإدارة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-4">الحالة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-4 hidden lg:table-cell">الصلاحية</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground p-4">عرض</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableRowsSkeleton rows={5} cols={6} />
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      لا يوجد موظفون
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const expired = emp.expiry_date && new Date(emp.expiry_date) < now;
                    return (
                      <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{emp.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{emp.employee_number || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground hidden sm:table-cell" dir="ltr">
                          {emp.employee_number || "—"}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {emp.department || "—"}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={emp.status === "active" ? "default" : "destructive"}
                            className={emp.status === "active" ? "status-active" : "status-suspended"}
                          >
                            {emp.status === "active" ? "مستمر" : "موقوف"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm hidden lg:table-cell">
                          {emp.expiry_date ? (
                            <span className={expired ? "text-destructive font-medium" : "text-muted-foreground"}>
                              {formatDate(emp.expiry_date)}
                              {expired && " (منتهية)"}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            to={`/dashboard/employees/${emp.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                صفحة {page} من {totalPages} — إجمالي {totalCount} موظف
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
