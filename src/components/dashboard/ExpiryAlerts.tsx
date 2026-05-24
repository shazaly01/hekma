import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExpiryAlert } from "@/hooks/useDashboardStats";

interface Props {
  alerts: ExpiryAlert[];
}

export default function ExpiryAlerts({ alerts }: Props) {
  const [showAll, setShowAll] = useState(false);

  const expiredCount = alerts.filter((a) => a.alert_type === "expired").length;
  const expiringCount = alerts.filter((a) => a.alert_type === "expiring").length;

  if (alerts.length === 0) return null;

  const visible = showAll ? alerts : alerts.slice(0, 5);

  return (
    <div className="space-y-3">
      {expiredCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-sm font-bold text-foreground">
              بطاقات منتهية الصلاحية ({expiredCount})
            </h2>
          </div>
          <div className="space-y-2">
            {visible
              .filter((a) => a.alert_type === "expired")
              .map((alert) => (
                <AlertRow key={alert.card_id} alert={alert} />
              ))}
          </div>
        </div>
      )}

      {expiringCount > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-sm font-bold text-foreground">
              بطاقات تنتهي خلال 30 يوماً ({expiringCount})
            </h2>
          </div>
          <div className="space-y-2">
            {visible
              .filter((a) => a.alert_type === "expiring")
              .map((alert) => (
                <AlertRow key={alert.card_id} alert={alert} />
              ))}
          </div>
        </div>
      )}

      {alerts.length > 5 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAll ? "rotate-180" : ""}`} />
            {showAll ? "عرض أقل" : `عرض الكل (${alerts.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: ExpiryAlert }) {
  const daysText = getDaysText(alert.expiry_date, alert.alert_type);

  return (
    <Link
      to={`/dashboard/employees/${alert.employee_id}`}
      className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 hover:bg-background transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
          {alert.employee_name.charAt(0)}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">{alert.employee_name}</span>
          <span className="text-xs text-muted-foreground">{alert.card_type_name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={alert.alert_type === "expired" ? "destructive" : "outline"}
          className={alert.alert_type === "expiring" ? "border-warning text-warning text-[10px]" : "text-[10px]"}
        >
          <Clock className="w-3 h-3 ml-1" />
          {daysText}
        </Badge>
      </div>
    </Link>
  );
}

function getDaysText(expiryDate: string, type: "expired" | "expiring"): string {
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffMs = type === "expired" ? now.getTime() - exp.getTime() : exp.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (type === "expired") {
    return days === 0 ? "انتهت اليوم" : `منتهية منذ ${days} يوم`;
  }
  return days === 0 ? "تنتهي اليوم" : days === 1 ? "تنتهي غداً" : `تنتهي خلال ${days} يوم`;
}
