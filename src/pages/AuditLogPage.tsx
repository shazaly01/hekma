import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search, Download, Filter } from "lucide-react";
import { exportExcel } from "@/lib/exportExcel";
import { TableRowsSkeleton } from "@/components/ui/loading-skeletons";

const actionLabels: Record<string, string> = {
  create: "إضافة",
  update: "تعديل",
  delete: "حذف",
};

const entityLabels: Record<string, string> = {
  employee: "موظف",
  card: "بطاقة",
  department: "إدارة",
  job_title: "وظيفة",
  nationality: "جنسية",
};

export default function AuditLogPage() {
  const [searchUser, setSearchUser] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await api.get("/audit-logs");
      return data;
    },
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      if (searchUser && !log.user_email?.toLowerCase().includes(searchUser.toLowerCase())) return false;
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      return true;
    });
  }, [logs, searchUser, actionFilter]);

  const handleExport = () => {
    exportExcel("سجل_النشاطات", filteredLogs, [
      { header: "التاريخ", render: (r: any) => format(new Date(r.created_at), "yyyy/MM/dd HH:mm") },
      { header: "المستخدم", render: (r: any) => r.user_email || "—" },
      { header: "الإجراء", render: (r: any) => actionLabels[r.action] || r.action },
      { header: "النوع", render: (r: any) => entityLabels[r.entity_type] || r.entity_type },
      { header: "تفاصيل", render: (r: any) => r.details ? (r.details.name || JSON.stringify(r.details).slice(0, 100)) : "—" },
    ], "سجل النشاطات");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">سجل النشاطات</h1>
          <Button onClick={handleExport} variant="outline" size="sm" disabled={filteredLogs.length === 0} className="self-end sm:self-auto">
            <Download className="w-4 h-4 ml-1" />
            تصدير Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالبريد الإلكتروني..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="جميع الإجراءات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الإجراءات</SelectItem>
              <SelectItem value="create">إضافة</SelectItem>
              <SelectItem value="update">تعديل</SelectItem>
              <SelectItem value="delete">حذف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full"><tbody><TableRowsSkeleton rows={6} cols={5} /></tbody></table>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">لا توجد سجلات</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="hidden sm:table-cell">المستخدم</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead className="hidden md:table-cell">النوع</TableHead>
                    <TableHead className="hidden lg:table-cell">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap p-3" dir="ltr">
                        {format(new Date(log.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell p-3">
                        <span className="truncate block max-w-[160px]">{log.user_email || "—"}</span>
                      </TableCell>
                      <TableCell className="p-3">
                        <div>
                          <Badge variant={log.action === "delete" ? "destructive" : log.action === "create" ? "default" : "secondary"} className="text-xs">
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          <span className="block sm:hidden text-xs text-muted-foreground mt-1 truncate max-w-[140px]">
                            {log.user_email || "—"}
                          </span>
                          <span className="block md:hidden text-xs text-muted-foreground">
                            {entityLabels[log.entity_type] || log.entity_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell p-3">{entityLabels[log.entity_type] || log.entity_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate hidden lg:table-cell p-3">
                        {log.details ? (log.details.name || JSON.stringify(log.details).slice(0, 60)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
