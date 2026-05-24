import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Shield, ShieldX, Eye, PenLine } from "lucide-react";

export function getRoleLabel(role: string | null): string {
  switch (role) {
    case "admin":      return "مشرف";
    case "editor":     return "محرر";
    case "data_entry": return "مدخل بيانات";
    case "viewer":     return "عارض فقط";
    default:           return "بدون دور";
  }
}

export function RoleBadge({ role }: { role: string | null }) {
  switch (role) {
    case "admin":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <ShieldCheck className="w-3 h-3 ml-1" />
          مشرف
        </Badge>
      );
    case "editor":
      return (
        <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400">
          <PenLine className="w-3 h-3 ml-1" />
          محرر
        </Badge>
      );
    case "data_entry":
      return (
        <Badge className="bg-accent/10 text-accent-foreground border-accent/20">
          <Shield className="w-3 h-3 ml-1" />
          مدخل بيانات
        </Badge>
      );
    case "viewer":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400">
          <Eye className="w-3 h-3 ml-1" />
          عارض فقط
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <ShieldX className="w-3 h-3 ml-1" />
          بدون دور
        </Badge>
      );
  }
}
