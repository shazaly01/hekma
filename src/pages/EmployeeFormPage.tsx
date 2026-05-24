import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { compressImage } from "@/lib/compressImage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getFileUrl } from "@/lib/utils";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { useDepartments, useJobTitles, useNationalities, useSections } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload, Save } from "lucide-react";
import { z } from "zod";

const employeeSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  english_name: z.string().trim().max(100).optional(),
  employee_number: z.string().trim().min(1, "الرقم الوظيفي مطلوب").max(50),
  department: z.string().trim().max(100).optional(),
  section: z.string().trim().max(100).optional(),
  job_title: z.string().trim().max(100).optional(),
  nationality: z.string().trim().max(100).optional(),
  passport_number: z.string().trim().max(50).optional(),
  card_number: z.string().trim().max(50).optional(),
  status: z.enum(["active", "suspended"]),
});

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();
  const { data: departments = [] } = useDepartments();
  const { data: jobTitles = [] } = useJobTitles();
  const { data: nationalities = [] } = useNationalities();
  const { data: sections = [] } = useSections();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const [form, setForm] = useState({
    name: "",
    english_name: "",
    employee_number: "",
    department: "",
    section: "",
    job_title: "",
    nationality: "",
    passport_number: "",
    card_number: "",
    status: "active" as "active" | "suspended",
  });

  const handleChange = (field: string, value: string) => {
    if (field === "department") {
      setForm((prev) => ({ ...prev, department: value, section: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const selectedDeptId = departments.find(d => d.name === form.department)?.id;
  const availableSections = sections.filter(s => s.department_id === selectedDeptId);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (file.size > MAX_SIZE) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("يُسمح فقط بصور JPEG و PNG و WebP");
      return;
    }

    setUploading(true);
    try {
      // Compress image to WebP format for optimal size/quality
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed, `${crypto.randomUUID()}.webp`);
      
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPhotoUrl(uploadData.url);
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("فشل ضغط أو رفع الصورة");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = employeeSchema.parse(form);
      await createEmployee.mutateAsync({
        name: parsed.name,
        english_name: parsed.english_name || null,
        status: parsed.status,
        photo_url: photoUrl || null,
        employee_number: parsed.employee_number || null,
        department: parsed.department || null,
        section: parsed.section || null,
        job_title: parsed.job_title || null,
        nationality: parsed.nationality || null,
        passport_number: parsed.passport_number || null,
        card_number: parsed.card_number || null,
      });
      toast.success("تمت إضافة الموظف بنجاح");
      navigate("/dashboard/employees");
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else if (err instanceof Error && err.message?.includes("idx_employees_employee_number_unique")) {
        toast.error("الرقم الوظيفي مستخدم بالفعل لموظف آخر");
      } else {
        toast.error("حدث خطأ أثناء الإضافة");
      }
    }
  };

  const isLibyan = form.nationality === "ليبي";
  const cardNumberLabel = isLibyan ? "الرقم الوطني" : "رقم بطاقة الحصر";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-6">إضافة موظف جديد</h1>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-card border border-border p-6 space-y-5">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center cursor-pointer overflow-hidden border-2 border-border"
              onClick={() => fileRef.current?.click()}
            >
              {photoUrl ? (
                <img src={getFileUrl(photoUrl)} alt="صورة" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-8 h-8 text-primary-foreground/60" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-accent hover:underline"
              disabled={uploading}
            >
              {uploading ? "جارٍ الرفع..." : "رفع صورة الموظف"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الاسم الانجليزي</Label>
              <Input value={form.english_name} onChange={(e) => handleChange("english_name", e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الرقم الوظيفي *</Label>
              <Input value={form.employee_number} onChange={(e) => handleChange("employee_number", e.target.value)} dir="ltr" required />
            </div>
            <div className="space-y-2">
              <Label>الإدارة</Label>
              <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الإدارة" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={form.section} onValueChange={(v) => handleChange("section", v)} disabled={!form.department || availableSections.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={!form.department ? "اختر الإدارة أولاً" : "اختر القسم"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوظيفة</Label>
              <Select value={form.job_title} onValueChange={(v) => handleChange("job_title", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوظيفة" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map((j) => (
                    <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الجنسية</Label>
              <Select value={form.nationality} onValueChange={(v) => handleChange("nationality", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنسية" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map((n) => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الجواز</Label>
              <Input value={form.passport_number} onChange={(e) => handleChange("passport_number", e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{cardNumberLabel}</Label>
              <Input value={form.card_number} onChange={(e) => handleChange("card_number", e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">مستمر</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground"
            disabled={createEmployee.isPending}
          >
            <Save className="w-4 h-4 ml-2" />
            {createEmployee.isPending ? "جارٍ الحفظ..." : "حفظ الموظف"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
