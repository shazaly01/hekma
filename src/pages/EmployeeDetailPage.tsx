import { useParams, useNavigate, Link } from "react-router-dom";
import { formatDate, getFileUrl } from "@/lib/utils";
import { compressImage } from "@/lib/compressImage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useEmployeeCards } from "@/hooks/useCards";
import { useNationalities, useDepartments as useSettingsDepartments, useJobTitles, useSections } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, permissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  ArrowRight, Edit, Trash2, QrCode, Download, Save, X, Upload, FileText, User, Camera, Printer, ImageDown,
} from "lucide-react";
import { z } from "zod";
import EmployeeCardsSection from "@/components/employees/EmployeeCardsSection";
import EmployeeChangeHistory from "@/components/employees/EmployeeChangeHistory";
import { generateIdCard, generateIdCardImage } from "@/components/employees/EmployeeIdCard";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailSkeleton } from "@/components/ui/loading-skeletons";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type { Tables } from "@/integrations/supabase/types";

type Archive = Tables<"employee_archives">;

const employeeSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  english_name: z.string().trim().max(100).optional(),
  employee_number: z.string().trim().min(1, "الرقم الوظيفي مطلوب").max(50, "الرقم الوظيفي طويل جداً"),
  department: z.string().trim().max(100).optional(),
  section: z.string().trim().max(100).optional(),
  job_title: z.string().trim().max(100).optional(),
  nationality: z.string().trim().max(100).optional(),
  passport_number: z.string().trim().max(50, "رقم الجواز طويل جداً").optional(),
  card_number: z.string().trim().max(50, "رقم البطاقة طويل جداً").optional(),
  status: z.enum(["active", "suspended"]),
});

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { data: employee, isLoading, refetch } = useEmployee(id);
  const { data: employeeCards = [] } = useEmployeeCards(id);
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { data: nationalities = [] } = useNationalities();
  const { data: departments = [] } = useSettingsDepartments();
  const { data: jobTitles = [] } = useJobTitles();
  const { data: sections = [] } = useSections();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [archives, setArchives] = useState<Archive[]>([]);
  const archiveRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploadingArchive, setUploadingArchive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const canEdit = hasPermission(role, permissions.employeeEdit);
  const canDelete = user?.is_super_admin === true;
  const canUploadArchive = hasPermission(role, permissions.employeeUploadArchive);
  const canDeleteArchive = hasPermission(role, permissions.employeeDeleteArchive);
  const { confirm, dialogProps } = useConfirmDialog();

  const selectedDeptId = departments.find(d => d.name === form.department)?.id;
  const availableSections = sections.filter(s => s.department_id === selectedDeptId);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        english_name: employee.english_name || "",
        employee_number: employee.employee_number || "",
        department: employee.department || "",
        section: employee.section || "",
        job_title: employee.job_title || "",
        nationality: (employee as any).nationality || "",
        passport_number: employee.passport_number || "",
        card_number: employee.card_number || "",
        status: employee.status || "active",
      });
    }
  }, [employee]);

  useEffect(() => {
    if (id) {
      api.get(`/employee-archives`, { params: { employee_id: id } })
        .then(({ data }) => {
          if (data) setArchives(data as Archive[]);
        });
    }
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const parsed = employeeSchema.parse(form);
      await updateEmployee.mutateAsync({
        id,
        name: parsed.name,
        english_name: parsed.english_name || null,
        employee_number: parsed.employee_number || null,
        department: parsed.department || null,
        section: parsed.section || null,
        job_title: parsed.job_title || null,
        nationality: parsed.nationality || null,
        passport_number: parsed.passport_number || null,
        card_number: parsed.card_number || null,
        status: parsed.status,
      } as any);
      toast.success("تم تحديث البيانات");
      setEditing(false);
      refetch();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else if (err instanceof Error && err.message?.includes("idx_employees_employee_number_unique")) {
        toast.error("الرقم الوظيفي مستخدم بالفعل لموظف آخر");
      } else {
        toast.error("حدث خطأ أثناء التحديث");
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm("حذف الموظف", "هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.", true);
    if (!confirmed) return;
    try {
      await deleteEmployee.mutateAsync(id);
      toast.success("تم حذف الموظف");
      navigate("/dashboard/employees");
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleArchiveUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (file.size > MAX_SIZE) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("يُسمح فقط بصور JPEG و PNG و WebP وملفات PDF");
      return;
    }

    setUploadingArchive(true);
    const ext = file.name.split(".").pop();
    const path = `${id}/${crypto.randomUUID()}.${ext}`;

    const formData = new FormData();
    formData.append("file", file);
    const { data: uploadData } = await api.post('/upload', formData);

    let archiveData = null;
    let insertError = null;
    try {
      const res = await api.post("/employee-archives", {
        employee_id: id,
        file_name: file.name,
        file_url: uploadData.url,
        file_type: file.type,
      });
      archiveData = res.data;
    } catch (e) {
      insertError = e;
    }

    if (insertError) {
      toast.error("فشل حفظ بيانات الملف");
    } else if (archiveData) {
      setArchives((prev) => [archiveData as Archive, ...prev]);
      toast.success("تم رفع الملف");
    }
    setUploadingArchive(false);
  };

  const handleDeleteArchive = async (archive: Archive) => {
    const confirmed = await confirm("حذف الملف", "هل تريد حذف هذا الملف من الأرشيف؟", true);
    if (!confirmed) return;
    await api.delete(`/employee-archives/${archive.id}`);
    setArchives((prev) => prev.filter((a) => a.id !== archive.id));
    toast.success("تم حذف الملف");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("يُسمح فقط بصور JPEG و PNG و WebP");
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed, `${crypto.randomUUID()}.webp`);

      const { data: uploadData } = await api.post('/upload', formData);
      const newUrl = uploadData.url;

      await updateEmployee.mutateAsync({
        id,
        photo_url: newUrl,
      } as any);

      toast.success("تم تحديث الصورة");
      refetch();
    } catch {
      toast.error("فشل رفع الصورة");
    }
    setUploadingPhoto(false);
  };

  const downloadQR = () => {
    const svg = document.getElementById("employee-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.download = `qr-${employee?.name || "employee"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Generate a dynamic public URL based on the current domain
  const publicUrl = `${window.location.origin}/employee/${id}`;

  const isLibyan = form.nationality === "ليبي";
  const cardNumberLabel = isLibyan ? "الرقم الوطني" : "رقم بطاقة الحصر";

  if (isLoading) {
    return (
      <DashboardLayout>
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center p-8 text-muted-foreground">الموظف غير موجود</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        {/* Header with photo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard/employees" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="relative group shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                {employee.photo_url ? (
                  <img src={getFileUrl(employee.photo_url)} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                )}
              </div>
              {canEdit && editing && (
                <>
                  <button
                    onClick={() => photoRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{employee.name}</h1>
                <Badge className={employee.status === "active" ? "status-active" : "status-suspended"}>
                  {employee.status === "active" ? "مستمر" : "موقوف"}
                </Badge>
              </div>
              {uploadingPhoto && <p className="text-xs text-muted-foreground">جارٍ رفع الصورة...</p>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-end sm:self-auto">
            {!editing ? (
              <>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Edit className="w-4 h-4 ml-1" /> تعديل
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={updateEmployee.isPending}>
                  <Save className="w-4 h-4 ml-1" /> حفظ
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 ml-1" /> إلغاء
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Info */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-card border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">بيانات الموظف</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "name", label: "الاسم" },
                { key: "english_name", label: "الاسم الانجليزي", dir: "ltr" },
                { key: "employee_number", label: "الرقم الوظيفي *", dir: "ltr" },
                { key: "department", label: "الإدارة" },
                { key: "section", label: "القسم" },
                { key: "job_title", label: "الوظيفة" },
                { key: "nationality", label: "الجنسية" },
                { key: "passport_number", label: "رقم الجواز", dir: "ltr" },
                { key: "card_number", label: cardNumberLabel, dir: "ltr" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  {editing ? (
                    field.key === "nationality" ? (
                      <Select value={form.nationality} onValueChange={(v) => setForm((prev) => ({ ...prev, nationality: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الجنسية" /></SelectTrigger>
                        <SelectContent>
                          {nationalities.map((n) => (
                            <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.key === "department" ? (
                      <Select value={form.department} onValueChange={(v) => setForm((prev) => ({ ...prev, department: v, section: "" }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الإدارة" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.key === "section" ? (
                      <Select value={form.section} onValueChange={(v) => setForm((prev) => ({ ...prev, section: v }))} disabled={!form.department || availableSections.length === 0}>
                        <SelectTrigger><SelectValue placeholder={!form.department ? "اختر الإدارة أولاً" : "اختر القسم"} /></SelectTrigger>
                        <SelectContent>
                          {availableSections.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.key === "job_title" ? (
                      <Select value={form.job_title} onValueChange={(v) => setForm((prev) => ({ ...prev, job_title: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الوظيفة" /></SelectTrigger>
                        <SelectContent>
                          {jobTitles.map((j) => (
                            <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={form[field.key] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        dir={field.dir}
                      />
                    )
                  ) : (
                    <p className="text-sm font-medium text-foreground" dir={field.dir}>
                      {(employee as Record<string, unknown>)[field.key] as string || "—"}
                    </p>
                  )}
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الحالة</Label>
                {editing ? (
                  <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">مستمر</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={employee.status === "active" ? "status-active" : "status-suspended"}>
                    {employee.status === "active" ? "مستمر" : "موقوف"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-card rounded-xl shadow-card border border-border p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              رمز QR
            </h2>
            <div className="bg-background rounded-lg p-4 inline-block mb-4">
              <QRCodeSVG
                id="employee-qr"
                value={publicUrl}
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-muted-foreground mb-3 break-all" dir="ltr">{publicUrl}</p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={downloadQR} className="w-full">
                <Download className="w-4 h-4 ml-2" />
                تحميل QR
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const activeCard = employeeCards.find((c: any) => !c.is_destroyed);
                const deptColor = departments.find(d => d.name === employee.department)?.color;
                const cardOpts = {
                  logoUrl: activeCard?.card_type_logo || null,
                  cardTypeName: activeCard?.card_type_name || null,
                  expiryDate: activeCard?.expiry_date || null,
                  issueDate: activeCard?.issue_date || null,
                  websiteText: activeCard?.website_text || null,
                  backInstructions: activeCard?.back_instructions || null,
                  cardTitle: activeCard?.card_title || null,
                  companyName: activeCard?.company_name || null,
                  departmentColor: deptColor || null,
                };
                generateIdCard(employee, publicUrl, cardOpts);
              }} className="w-full">
                <Printer className="w-4 h-4 ml-2" />
                طباعة بطاقة PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const activeCard = employeeCards.find((c: any) => !c.is_destroyed);
                const deptColor = departments.find(d => d.name === employee.department)?.color;
                const cardOpts = {
                  logoUrl: activeCard?.card_type_logo || null,
                  cardTypeName: activeCard?.card_type_name || null,
                  expiryDate: activeCard?.expiry_date || null,
                  issueDate: activeCard?.issue_date || null,
                  websiteText: activeCard?.website_text || null,
                  backInstructions: activeCard?.back_instructions || null,
                  cardTitle: activeCard?.card_title || null,
                  companyName: activeCard?.company_name || null,
                  departmentColor: deptColor || null,
                };
                generateIdCardImage(employee, publicUrl, cardOpts);
              }} className="w-full">
                <ImageDown className="w-4 h-4 ml-2" />
                تحميل بطاقة PNG
              </Button>
            </div>
          </div>
        </div>
        {/* Cards */}
        <EmployeeCardsSection employeeId={id!} />

        {/* Archives */}
        <div className="bg-card rounded-xl shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">الأرشيف</h2>
            {canUploadArchive && (
              <>
                <Button variant="outline" size="sm" onClick={() => archiveRef.current?.click()} disabled={uploadingArchive}>
                  <Upload className="w-4 h-4 ml-2" />
                  {uploadingArchive ? "جارٍ الرفع..." : "رفع ملف"}
                </Button>
                <input
                  ref={archiveRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleArchiveUpload}
                />
              </>
            )}
          </div>

          {archives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد ملفات في الأرشيف</p>
          ) : (
            <div className="space-y-2">
              {archives.map((archive) => (
                <div key={archive.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{archive.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(archive.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const filePath = archive.file_url;
                        // If it's already a full URL (legacy), open directly
                        if (filePath.startsWith("http")) {
                          window.open(filePath, "_blank");
                          return;
                        }
                        window.open(filePath, "_blank");
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      عرض
                    </button>
                    {canDeleteArchive && (
                      <button
                        onClick={() => handleDeleteArchive(archive)}
                        className="text-xs text-destructive hover:underline"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change History */}
        <EmployeeChangeHistory employeeId={id!} />
      </div>
      <ConfirmDialog {...dialogProps} />
    </DashboardLayout>
  );
}
