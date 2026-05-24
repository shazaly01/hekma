import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Shield, Verified, AlertTriangle, AlertCircle, FileText, CheckCircle2, User, Briefcase, Hash, Calendar, CreditCard, Clock, Lock } from "lucide-react";
import { getFileUrl } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useMemo, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

function usePinStatus(id: string | undefined) {
  return useQuery({
    queryKey: ["qr-pin-status", id],
    queryFn: async () => {
      if (!id) return { pin_required: false };
      const { data } = await api.get(`/public/employee/${id}/pin-status`);
      return data ?? { pin_required: false };
    },
    enabled: !!id,
  });
}

function usePublicEmployee(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["public-employee", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/public/employee/${id}`);
      return data ?? null;
    },
    enabled: !!id && enabled,
  });
}

function useVerifyPin() {
  return useMutation({
    mutationFn: async ({ emp_id, input_pin }: { emp_id: string; input_pin: string }) => {
      const { data } = await api.post(`/public/employee/${emp_id}/verify-pin`, { pin: input_pin });
      return data.success as boolean;
    },
  });
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export default function EmployeePublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: pinStatus, isLoading: pinLoading } = usePinStatus(id);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const verifyPin = useVerifyPin();

  const pinRequired = pinStatus?.pin_required === true;
  const showData = !pinRequired || pinVerified;

  const { data: employee, isLoading: empLoading, error } = usePublicEmployee(id, showData);
  const verifiedAt = useMemo(() => new Date().toLocaleString("en-GB"), []);

  // Log scan
  useEffect(() => {
    if (!id) return;
    api.post("/public/log-qr-scan", { employee_id: id }).catch(() => {});
  }, [id]);

  const handleVerify = async () => {
    if (!id || pinValue.length !== 4) return;
    setPinError(false);
    const result = await verifyPin.mutateAsync({ emp_id: id, input_pin: pinValue });
    if (result) {
      setPinVerified(true);
    } else {
      setPinError(true);
      setPinValue("");
    }
  };

  if (pinLoading) return <PageSkeleton />;

  // PIN gate
  if (pinRequired && !pinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-card rounded-2xl shadow-elevated border border-border p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">صفحة محمية</h1>
            <p className="text-sm text-muted-foreground mb-6">أدخل رمز الحماية للمتابعة</p>
            <div className="flex justify-center mb-4" dir="ltr">
              <InputOTP maxLength={4} value={pinValue} onChange={(v) => { setPinValue(v); setPinError(false); }}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {pinError && (
              <p className="text-sm text-destructive mb-3">رمز غير صحيح، حاول مرة أخرى</p>
            )}
            <Button
              onClick={handleVerify}
              disabled={pinValue.length !== 4 || verifyPin.isPending}
              className="w-full gradient-primary text-primary-foreground"
            >
              {verifyPin.isPending ? "جارٍ التحقق..." : "تحقق"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (empLoading) return <PageSkeleton />;

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center animate-fade-in">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">الموظف غير موجود</h1>
          <p className="text-sm text-muted-foreground">لم يتم العثور على بيانات لهذا الموظف</p>
        </div>
      </div>
    );
  }

  const logoUrl = (employee as any).card_type_logo;
  const cardTypeName = (employee as any).card_type_name;
  const issueDate = (employee as any).issue_date;
  const expiryDate = (employee as any).expiry_date;
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
  const isSuspended = employee.status !== "active";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden relative">
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" aria-hidden="true">
              <div className="border-4 border-destructive/60 text-destructive/60 rounded-xl px-8 py-3 text-3xl font-black rotate-[-20deg] tracking-widest">
                منتهية
              </div>
            </div>
          )}
          {logoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
              <img src={logoUrl} alt="" className="w-[80%] max-h-[65%] object-contain opacity-[0.12]" />
            </div>
          )}
          <div className={`p-6 text-center relative z-10 ${isSuspended ? "bg-destructive" : "gradient-primary"}`}>
            <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary-foreground/20 overflow-hidden bg-primary-foreground/10 flex items-center justify-center shadow-lg">
              {employee.photo_url ? (
                <img src={getFileUrl(employee.photo_url)} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-primary-foreground/60" />
              )}
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">{employee.name}</h1>
            {employee.english_name && <p className="text-sm text-primary-foreground/70 mt-1" dir="ltr">{employee.english_name}</p>}
            {isSuspended && (
              <div className="mt-3 flex items-center justify-center gap-2 text-destructive-foreground">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-base">موقوف عن العمل</span>
              </div>
            )}
          </div>
          <div className="p-6 space-y-4 relative z-10">
            {employee.employee_number && <InfoRow icon={Hash} label="الرقم الوظيفي" value={employee.employee_number} dir="ltr" />}
            
            {employee.department && <InfoRow icon={Briefcase} label="الإدارة" value={employee.department} />}
            {employee.section && <InfoRow icon={Briefcase} label="القسم" value={employee.section} />}
            {employee.job_title && <InfoRow icon={Briefcase} label="الوظيفة" value={employee.job_title} />}
            
            {employee.nationality && <InfoRow icon={User} label="الجنسية" value={employee.nationality} />}
            {issueDate && <InfoRow icon={Calendar} label="تاريخ الإصدار" value={formatDate(issueDate)!} />}
            {expiryDate && <InfoRow icon={Calendar} label="تاريخ الانتهاء" value={formatDate(expiryDate)!} highlight={isExpired ? "destructive" : undefined} />}
            
            {cardTypeName && <InfoRow icon={CreditCard} label="نوع البطاقة" value={cardTypeName} />}
            {!isSuspended && (
              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground mb-2">الحالة</p>
                <Badge className="text-base px-6 py-2 status-active">
                  {isExpired ? "⚠️ البطاقة منتهية الصلاحية" : "✅ مستمر في العمل"}
                </Badge>
              </div>
            )}
          </div>
          <div className="px-6 pb-4 text-center relative z-10 space-y-2">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>تم التحقق في: {verifiedAt}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>منظومة بطاقات الموظفين</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir, highlight }: {
  icon: React.ElementType; label: string; value: string; dir?: string; highlight?: "destructive";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? "bg-destructive/10" : "bg-muted"}`}>
        <Icon className={`w-5 h-5 ${highlight ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? "text-destructive" : "text-foreground"}`} dir={dir}>{value}</p>
      </div>
    </div>
  );
}
