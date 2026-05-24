import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QrCode, Eye, Clock, Users, TrendingUp, Download, ChevronRight, ChevronLeft } from "lucide-react";
import { PageSkeleton } from "@/components/ui/loading-skeletons";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

interface QrScan {
  id: string;
  employee_id: string;
  scanned_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

function useQrScans() {
  return useQuery({
    queryKey: ["qr-scans"],
    queryFn: async () => {
      const { data } = await api.get("/qr-scans");
      return (data ?? []) as QrScan[];
    },
  });
}

function useEmployeeNames(ids: string[]) {
  return useQuery({
    queryKey: ["employee-names", ids],
    queryFn: async () => {
      if (!ids.length) return {};
      const { data } = await api.get("/employees/names", { params: { ids: ids.join(",") } });
      const map: Record<string, string> = {};
      data?.forEach((e) => (map[e.id] = e.name));
      return map;
    },
    enabled: ids.length > 0,
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeviceType(ua: string | null) {
  if (!ua) return "غير معروف";
  const lower = ua.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return "جوال";
  if (lower.includes("tablet") || lower.includes("ipad")) return "لوحي";
  return "حاسوب";
}
function exportToExcel(scans: QrScan[], nameMap: Record<string, string>) {
  const rows = scans.map((s) => ({
    "الموظف": nameMap[s.employee_id] || s.employee_id,
    "التاريخ والوقت": formatDateTime(s.scanned_at),
    "الجهاز": getDeviceType(s.user_agent),
    "عنوان IP": s.ip_address || "—",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "سجل المسح");
  XLSX.writeFile(wb, `سجل-مسح-QR-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function QrScansPage() {
  const { data: scans, isLoading } = useQrScans();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const uniqueEmployeeIds = useMemo(
    () => [...new Set(scans?.map((s) => s.employee_id) ?? [])],
    [scans]
  );
  const { data: nameMap = {} } = useEmployeeNames(uniqueEmployeeIds);

  // Stats
  const stats = useMemo(() => {
    if (!scans?.length) return { total: 0, uniqueEmployees: 0, today: 0, thisWeek: 0 };
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    return {
      total: scans.length,
      uniqueEmployees: new Set(scans.map((s) => s.employee_id)).size,
      today: scans.filter((s) => new Date(s.scanned_at) >= startOfDay).length,
      thisWeek: scans.filter((s) => new Date(s.scanned_at) >= startOfWeek).length,
    };
  }, [scans]);

  // Per-employee stats
  const employeeStats = useMemo(() => {
    if (!scans?.length) return [];
    const map: Record<string, { count: number; lastScan: string }> = {};
    scans.forEach((s) => {
      if (!map[s.employee_id]) {
        map[s.employee_id] = { count: 0, lastScan: s.scanned_at };
      }
      map[s.employee_id].count++;
      if (s.scanned_at > map[s.employee_id].lastScan) {
        map[s.employee_id].lastScan = s.scanned_at;
      }
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, name: nameMap[id] || id.slice(0, 8), ...v }))
      .sort((a, b) => b.count - a.count);
  }, [scans, nameMap]);

  // Daily chart data (last 14 days)
  const chartData = useMemo(() => {
    if (!scans?.length) return [];
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    scans.forEach((s) => {
      const key = s.scanned_at.slice(0, 10);
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      عمليات: count,
    }));
  }, [scans]);

  // Filtered scans
  const filtered = useMemo(() => {
    if (!scans) return [];
    if (!search.trim()) return scans;
    const q = search.trim().toLowerCase();
    return scans.filter(
      (s) =>
        (nameMap[s.employee_id] || "").toLowerCase().includes(q) ||
        s.employee_id.includes(q) ||
        (s.ip_address || "").includes(q)
    );
  }, [scans, search, nameMap]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedScans = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل مسح QR</h1>
            <p className="text-sm text-muted-foreground">تتبع عمليات التحقق من بطاقات الموظفين</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="إجمالي المسحات" value={stats.total} />
          <StatCard icon={Users} label="موظفون تم مسحهم" value={stats.uniqueEmployees} />
          <StatCard icon={Clock} label="اليوم" value={stats.today} />
          <StatCard icon={TrendingUp} label="هذا الأسبوع" value={stats.thisWeek} />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">عمليات المسح - آخر 14 يوم</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="عمليات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Employees */}
        {employeeStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أكثر الموظفين مسحاً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {employeeStats.slice(0, 6).map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.count} مسح • آخر: {formatDateTime(e.lastScan)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan Log Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">سجل المسحات</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="بحث بالاسم أو IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={filtered.length === 0}
                onClick={() => exportToExcel(filtered, nameMap)}
                className="gap-1 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>لا توجد عمليات مسح بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-right">التاريخ والوقت</TableHead>
                      <TableHead className="text-right">الجهاز</TableHead>
                      <TableHead className="text-right">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">
                          {nameMap[scan.employee_id] || scan.employee_id.slice(0, 8)}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {formatDateTime(scan.scanned_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getDeviceType(scan.user_agent)}</Badge>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right text-muted-foreground text-xs">
                          {scan.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between px-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1}
                      className="gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      صفحة {page} من {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages}
                      className="gap-1"
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
