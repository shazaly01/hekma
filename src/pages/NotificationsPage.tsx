import { useState } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, XCircle, Info, Filter, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useDeleteAllNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

type FilterType = "all" | "info" | "warning" | "error";
type FilterStatus = "all" | "unread" | "read";

function getTypeIcon(type: string) {
  switch (type) {
    case "error": return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
    case "warning": return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
    default: return <Info className="w-5 h-5 text-primary shrink-0" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "error": return "خطأ";
    case "warning": return "تحذير";
    default: return "معلومات";
  }
}

function getTypeBadgeVariant(type: string): "destructive" | "default" | "secondary" {
  switch (type) {
    case "error": return "destructive";
    case "warning": return "default";
    default: return "secondary";
  }
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();

  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const filtered = notifications.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter === "unread" && n.is_read) return false;
    if (statusFilter === "read" && !n.is_read) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    const dateKey = format(new Date(n.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(n);
    return acc;
  }, {});

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function getDateLabel(dateKey: string) {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    if (dateKey === today) return "اليوم";
    if (dateKey === yesterday) return "أمس";
    return format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: ar });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
              الإشعارات
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="w-4 h-4" />
                تمييز الكل كمقروء
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                حذف الكل
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="info">معلومات</SelectItem>
              <SelectItem value="warning">تحذيرات</SelectItem>
              <SelectItem value="error">أخطاء</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="unread">غير مقروء</SelectItem>
              <SelectItem value="read">مقروء</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setTypeFilter("all"); setStatusFilter("all"); }}>
              مسح الفلاتر
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد إشعارات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1">
                  {getDateLabel(dateKey)}
                </h3>
                <div className="space-y-2">
                  {grouped[dateKey].map((n) => (
                    <div
                      key={n.id}
                      className={`bg-card rounded-xl border border-border p-4 transition-all hover:shadow-md ${
                        !n.is_read ? "border-l-4 border-l-primary" : "opacity-70"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(n.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{n.title}</p>
                            <Badge variant={getTypeBadgeVariant(n.type)} className="text-[10px] h-5">
                              {getTypeLabel(n.type)}
                            </Badge>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-muted-foreground/60">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                            </span>
                            {n.entity_type && (
                              <span className="text-[11px] text-muted-foreground/60">
                                • {n.entity_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead.mutate(n.id)}
                              title="تمييز كمقروء"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNotification.mutate(n.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
        title="حذف جميع الإشعارات"
        description="هل أنت متأكد من حذف جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => deleteAll.mutate()}
        confirmText="حذف الكل"
        destructive
      />
    </DashboardLayout>
  );
}
