import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import {
  Users,
  UserPlus,
  LayoutDashboard,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
  UserCog,
  Settings,
  ClipboardList,
  Moon,
  Sun,
  QrCode,
  Bell,
  Info,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/dashboard/employees", label: "الموظفون", icon: Users },
  { path: "/dashboard/employees/new", label: "إضافة موظف", icon: UserPlus, roles: ["admin", "editor", "data_entry"] },
  { path: "/dashboard/reports", label: "تقارير البطاقات", icon: FileText },
  { path: "/dashboard/employee-reports", label: "تقارير الموظفين", icon: Users },
  { path: "/dashboard/settings", label: "الإدارات والوظائف", icon: Settings, roles: ["admin", "editor"] },
  { path: "/dashboard/cards-settings", label: "أنواع البطاقات", icon: CreditCard, roles: ["admin", "editor"] },
  { path: "/dashboard/roles", label: "إدارة الأدوار", icon: UserCog, adminOnly: true },
  { path: "/dashboard/qr-scans", label: "سجل مسح QR", icon: QrCode, roles: ["admin", "editor"] },
  { path: "/dashboard/audit-log", label: "سجل النشاطات", icon: ClipboardList, roles: ["admin", "editor"] },
  { path: "/dashboard/notifications", label: "الإشعارات", icon: Bell },
  { path: "/dashboard/about", label: "نبذة عن النظام", icon: Info },
  { path: "/dashboard/profile", label: "الملف الشخصي", icon: Users },
];

function DisplayName({ userId, fallback }: { userId?: string; fallback?: string | null }) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    api.get(`/profiles/${userId}`).then(({ data }) => { if (data?.display_name) setName(data.display_name); }).catch(() => {});
  }, [userId]);
  return <p className="text-xs text-sidebar-foreground truncate">{name || fallback || "—"}</p>;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly) return role === "admin";
    if (item.roles) return role ? item.roles.includes(role) : false;
    return true;
  });

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col gradient-sidebar fixed inset-y-0 right-0 z-30">
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">بطاقات الموظفين</h1>
            <p className="text-xs text-sidebar-foreground/60">نظام الإدارة</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
              {role === "admin" ? "م" : role === "viewer" ? "ع" : "د"}
            </div>
            <div className="flex-1 min-w-0">
              <DisplayName userId={user?.id} fallback={user?.email} />
              <p className="text-xs text-sidebar-foreground/50">
                {role === "admin" ? "مشرف" : role === "editor" ? "محرر" : role === "data_entry" ? "مدخل بيانات" : role === "viewer" ? "عارض فقط" : "بدون دور"}
              </p>
            </div>
            <NotificationBell className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 w-8" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 w-8"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 gradient-primary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-foreground" />
            <span className="text-sm font-bold text-primary-foreground">بطاقات الموظفين</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell className="text-primary-foreground hover:bg-primary/80" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-primary-foreground hover:bg-primary/80"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-primary-foreground hover:bg-primary/80"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <nav className="p-4 space-y-1 border-t border-primary-foreground/10 max-h-[calc(100vh-64px)] overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-primary-foreground/70 hover:bg-primary-foreground/10 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 min-h-screen">
        <div className="p-4 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
