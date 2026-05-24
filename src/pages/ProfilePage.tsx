import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      api.get("/profiles/me").then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!user || !displayName.trim()) return;
    setLoading(true);
    // Use upsert to handle case where profile doesn't exist yet
    const error = await api.put("/profiles/me", { display_name: displayName.trim() }).then(()=>null).catch(e=>e);
    if (error) {
      toast.error("فشل تحديث الاسم");
    } else {
      toast.success("تم تحديث الاسم");
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    setChangingPassword(true);
    const error = await api.post("/auth/change-password", { password: newPassword }).then(()=>null).catch(e=>e);
    if (error) {
      toast.error("فشل تغيير كلمة المرور: " + error.message);
    } else {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">الملف الشخصي</h1>

        <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">المعلومات الشخصية</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
            <p className="text-sm text-foreground" dir="ltr">{user?.email}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">الاسم</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="أدخل اسمك" />
          </div>
          <Button onClick={handleUpdateName} disabled={loading || !displayName.trim()} className="gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 ml-1" />
            {loading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">تغيير كلمة المرور</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">كلمة المرور الجديدة</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">تأكيد كلمة المرور</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="أعد إدخال كلمة المرور" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline">
            <Lock className="w-4 h-4 ml-1" />
            {changingPassword ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
