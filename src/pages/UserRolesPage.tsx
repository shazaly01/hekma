import { useState } from "react";
import { formatDate } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUsersWithRoles, useAssignRole, useRemoveRole, useDeleteUser, UserWithRole as OriginalUserWithRole } from "@/hooks/useUserRoles";

type UserWithRole = OriginalUserWithRole & { is_super_admin?: boolean };
import { TableRowsSkeleton } from "@/components/ui/loading-skeletons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserCog, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { RoleBadge, getRoleLabel } from "@/components/users/RoleBadge";
import CreateUserDialog from "@/components/users/CreateUserDialog";

type ConfirmAction =
  | { type: "assign"; user: UserWithRole; newRole: "admin" | "editor" | "data_entry" | "viewer" }
  | { type: "remove"; user: UserWithRole }
  | { type: "delete"; user: UserWithRole };

export default function UserRolesPage() {
  const { role: currentUserRole, user: currentUser, refreshUser } = useAuth();
  const { data: users = [], isLoading } = useUsersWithRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (currentUserRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = (user: UserWithRole, newRole: string) => {
    if (newRole === "none") {
      setConfirmAction({ type: "remove", user });
    } else {
      setConfirmAction({ type: "assign", user, newRole: newRole as "admin" | "editor" | "data_entry" | "viewer" });
    }
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setConfirmAction({ type: "delete", user });
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case "remove":
          await removeRole.mutateAsync(confirmAction.user.id);
          toast({ title: "تم إزالة الدور بنجاح" });
          break;
        case "assign":
          await assignRole.mutateAsync({ user_id: confirmAction.user.id, role: confirmAction.newRole });
          toast({ title: "تم تعيين الدور بنجاح" });
          break;
        case "delete":
          await deleteUser.mutateAsync(confirmAction.user.id);
          toast({ title: "تم حذف المستخدم بنجاح" });
          break;
      }
      // If admin changed their own role, refresh session immediately
      if (confirmAction.user.id === currentUser?.id) {
        await refreshUser();
      }
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }

    setConfirmAction(null);
  };

  const getConfirmTitle = () => {
    if (!confirmAction) return "";
    switch (confirmAction.type) {
      case "remove": return "إزالة الدور";
      case "assign": return "تغيير الدور";
      case "delete": return "حذف المستخدم";
    }
  };

  const getConfirmDescription = () => {
    if (!confirmAction) return "";
    const email = confirmAction.user.email;
    switch (confirmAction.type) {
      case "remove":
        return `هل أنت متأكد من إزالة دور المستخدم ${email}؟ لن يتمكن من الوصول للنظام.`;
      case "assign":
        return `هل تريد تعيين "${getRoleLabel(confirmAction.newRole)}" كدور للمستخدم ${email}؟`;
      case "delete":
        return `هل أنت متأكد من حذف المستخدم ${email} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <UserCog className="w-6 h-6 sm:w-7 sm:h-7" />
              إدارة المستخدمين
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              إضافة وحذف المستخدمين وإدارة صلاحياتهم
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 self-end sm:self-auto">
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 sm:p-4">
                    المستخدم
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 sm:p-4 hidden md:table-cell">
                    تاريخ التسجيل
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground p-3 sm:p-4 hidden sm:table-cell">
                    الدور
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground p-3 sm:p-4">
                    تغيير الدور
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground p-3 sm:p-4">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableRowsSkeleton rows={4} cols={5} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      لا يوجد مستخدمون
                    </td>
                  </tr>
                ) : (
                  users.map((u: UserWithRole) => {
                    const isCurrentUser = u.id === currentUser?.id;
                    const isSuperAdmin = u.is_super_admin;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {u.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                                {u.email}
                                {isCurrentUser && (
                                  <span className="text-xs text-muted-foreground mr-2">(أنت)</span>
                                )}
                                {isSuperAdmin && (
                                  <span className="text-xs text-primary mr-2 font-bold">(مدير عام)</span>
                                )}
                              </p>
                              <div className="sm:hidden mt-0.5">
                                <RoleBadge role={u.role} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="p-3 sm:p-4 hidden sm:table-cell">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex justify-center">
                            {isCurrentUser || isSuperAdmin ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <Select
                                value={u.role || "none"}
                                onValueChange={(val) => handleRoleChange(u, val)}
                              >
                                <SelectTrigger className="w-28 sm:w-36 h-9 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">مشرف</SelectItem>
                                  <SelectItem value="editor">محرر</SelectItem>
                                  <SelectItem value="data_entry">مدخل بيانات</SelectItem>
                                  <SelectItem value="viewer">عارض فقط</SelectItem>
                                  <SelectItem value="none">بدون دور</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex justify-center">
                            {isCurrentUser || isSuperAdmin ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser(u)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getConfirmTitle()}</AlertDialogTitle>
            <AlertDialogDescription>{getConfirmDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
