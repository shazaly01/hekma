import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeListPage from "./pages/EmployeeListPage";
import EmployeeFormPage from "./pages/EmployeeFormPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import EmployeePublicPage from "./pages/EmployeePublicPage";
import ReportsPage from "./pages/ReportsPage";
import EmployeeReportsPage from "./pages/EmployeeReportsPage";
import UserRolesPage from "./pages/UserRolesPage";
import SettingsPage from "./pages/SettingsPage";
import CardsSettingsPage from "./pages/CardsSettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import ProfilePage from "./pages/ProfilePage";
import QrScansPage from "./pages/QrScansPage";
import NotificationsPage from "./pages/NotificationsPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-cairo">جارٍ التحميل...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  useRealtimeSubscriptions();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/employee/:id" element={<EmployeePublicPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard/employees" element={<ProtectedRoute><EmployeeListPage /></ProtectedRoute>} />
      <Route path="/dashboard/employees/new" element={<ProtectedRoute allowedRoles={["admin", "editor", "data_entry"]}><EmployeeFormPage /></ProtectedRoute>} />
      <Route path="/dashboard/employees/:id" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/dashboard/employee-reports" element={<ProtectedRoute><EmployeeReportsPage /></ProtectedRoute>} />
      <Route path="/dashboard/roles" element={<ProtectedRoute allowedRoles={["admin"]}><UserRolesPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={["admin", "editor"]}><SettingsPage /></ProtectedRoute>} />
      <Route path="/dashboard/cards-settings" element={<ProtectedRoute allowedRoles={["admin", "editor"]}><CardsSettingsPage /></ProtectedRoute>} />
      <Route path="/dashboard/audit-log" element={<ProtectedRoute allowedRoles={["admin", "editor"]}><AuditLogPage /></ProtectedRoute>} />
      <Route path="/dashboard/qr-scans" element={<ProtectedRoute allowedRoles={["admin", "editor"]}><QrScansPage /></ProtectedRoute>} />
      <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/dashboard/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
