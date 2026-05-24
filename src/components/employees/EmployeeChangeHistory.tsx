import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  user_email: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "إنشاء", color: "bg-success/10 text-success" },
  update: { label: "تعديل", color: "bg-accent/10 text-accent" },
  delete: { label: "حذف", color: "bg-destructive/10 text-destructive" },
  status_change: { label: "تغيير حالة", color: "bg-warning/10 text-warning" },
};

function getActionDisplay(action: string) {
  const match = Object.entries(ACTION_LABELS).find(([key]) => action.toLowerCase().includes(key));
  return match ? match[1] : { label: action, color: "bg-muted text-muted-foreground" };
}

function renderDetails(details: Record<string, unknown> | null) {
  if (!details) return null;

  const FIELD_LABELS: Record<string, string> = {
    name: "الاسم",
    employee_number: "الرقم الوظيفي",
    department: "الإدارة",
    job_title: "الوظيفة",
    nationality: "الجنسية",
    passport_number: "رقم الجواز",
    card_number: "رقم البطاقة",
    status: "الحالة",
    photo_url: "الصورة",
    expiry_date: "تاريخ الانتهاء",
  };

  const STATUS_LABELS: Record<string, string> = {
    active: "مستمر",
    suspended: "موقوف",
  };

  // Handle "changes" object pattern: { changes: { field: { old, new } } }
  const changes = details.changes as Record<string, { old?: string; new?: string }> | undefined;
  if (changes && typeof changes === "object") {
    const entries = Object.entries(changes);
    if (entries.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        {entries.map(([field, val]) => {
          const label = FIELD_LABELS[field] || field;
          const oldVal = field === "status" ? STATUS_LABELS[val.old || ""] || val.old : val.old;
          const newVal = field === "status" ? STATUS_LABELS[val.new || ""] || val.new : val.new;
          if (field === "photo_url") {
            return (
              <p key={field} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{label}:</span> تم تحديث الصورة
              </p>
            );
          }
          return (
            <p key={field} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{label}:</span>{" "}
              <span className="line-through opacity-60">{oldVal || "—"}</span>
              {" → "}
              <span className="font-medium">{newVal || "—"}</span>
            </p>
          );
        })}
      </div>
    );
  }

  // Fallback: show raw details
  const filtered = Object.entries(details).filter(([k]) => k !== "employee_id" && k !== "id");
  if (filtered.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {filtered.map(([key, val]) => (
        <p key={key} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{FIELD_LABELS[key] || key}:</span>{" "}
          {String(val ?? "—")}
        </p>
      ))}
    </div>
  );
}

export default function EmployeeChangeHistory({ employeeId }: { employeeId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    api.get("/audit-logs", { params: { entity_id: employeeId, entity_type: "employee", limit: 500 } })
      .then(({ data }) => {
        setLogs((data as unknown as AuditLog[] | null) || []);
        setLoading(false);
      });
  }, [employeeId]);

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const visible = logs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">سجل التغييرات</h2>
        <Badge variant="secondary">{logs.length}</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">جارٍ التحميل...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد سجلات تغييرات</p>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((log) => {
              const display = getActionDisplay(log.action);
              return (
                <div key={log.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${display.color} text-[10px]`}>{display.label}</Badge>
                      <span className="text-xs text-muted-foreground">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {log.user_email && <span>{log.user_email}</span>}
                      <span dir="ltr">{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                  {renderDetails(log.details as Record<string, unknown> | null)}
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
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
        </>
      )}
    </div>
  );
}
