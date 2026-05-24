import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard, AlertTriangle, ImageIcon, Check, X, Shield, Edit2 } from "lucide-react";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/compressImage";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingsSkeleton } from "@/components/ui/loading-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useCardTypesAdmin, useCreateCardType, useDeleteCardType,
  useDestructionReasons, useCreateDestructionReason, useDeleteDestructionReason,
  useUpdateCardTypeLogo, useUpdateCardType
} from "@/hooks/useCards";
import { useAppSetting, useUpdateAppSetting, useUpdateCardTypePin } from "@/hooks/useAppSettings";

function QrPinSection() {
  const { data: globalEnabled, isLoading: loadingEnabled } = useAppSetting("global_pin_enabled");
  const { data: globalPin, isLoading: loadingPin } = useAppSetting("global_pin_code");
  const updateSetting = useUpdateAppSetting();
  const [pinValue, setPinValue] = useState<string>("");
  const isEnabled = globalEnabled === true;

  const handleToggle = async (checked: boolean) => {
    try {
      await updateSetting.mutateAsync({ key: "global_pin_enabled", value: checked });
      toast.success(checked ? "تم تفعيل الرمز العام" : "تم تعطيل الرمز العام");
    } catch { toast.error("فشل التحديث"); }
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinValue)) { toast.error("يجب أن يكون الرمز 4 أرقام"); return; }
    try {
      await updateSetting.mutateAsync({ key: "global_pin_code", value: pinValue });
      toast.success("تم حفظ الرمز");
      setPinValue("");
    } catch { toast.error("فشل الحفظ"); }
  };

  if (loadingEnabled || loadingPin) return <SettingsSkeleton />;

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">حماية صفحة QR</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">تفعيل الرمز العام</p>
            <p className="text-xs text-muted-foreground">رمز واحد لجميع الموظفين</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={updateSetting.isPending} />
        </div>
        {isEnabled && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">الرمز الحالي: <span className="font-mono font-bold">{globalPin || "0000"}</span></p>
              <Input
                placeholder="رمز جديد (4 أرقام)"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="font-mono text-center tracking-widest"
                dir="ltr"
              />
            </div>
            <Button onClick={handleSavePin} disabled={pinValue.length !== 4 || updateSetting.isPending} size="sm">
              حفظ
            </Button>
          </div>
        )}
        {!isEnabled && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            💡 عند تعطيل الرمز العام، يمكنك تفعيل رمز خاص لكل نوع بطاقة من قسم "أنواع البطاقات" أدناه.
          </p>
        )}
      </div>
    </div>
  );
}

function CardTypesSection() {
  const { data: items, isLoading } = useCardTypesAdmin();
  const create = useCreateCardType();
  const remove = useDeleteCardType();
  const updateLogo = useUpdateCardTypeLogo();
  const updatePin = useUpdateCardTypePin();
  const updateType = useUpdateCardType();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();
  const { data: globalEnabled } = useAppSetting("global_pin_enabled");
  const isGlobalEnabled = globalEnabled === true;
  
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    card_title: "بطاقة موظف",
    company_name: "شركة المستقبل للتقنية",
    website_text: "www.futuretech.sa",
    back_instructions: "هذه البطاقة ملك لشركة المستقبل. في حال العثور عليها يرجى إعادتها لأقرب فرع.\nالهاتف: 920000000 | البريد: info@ft.sa"
  });

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name || "",
        card_title: item.card_title || "بطاقة موظف",
        company_name: item.company_name || "شركة المستقبل للتقنية",
        website_text: item.website_text || "www.futuretech.sa",
        back_instructions: item.back_instructions || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        card_title: "بطاقة موظف",
        company_name: "شركة المستقبل للتقنية",
        website_text: "www.futuretech.sa",
        back_instructions: "هذه البطاقة ملك لشركة المستقبل. في حال العثور عليها يرجى إعادتها لأقرب فرع.\nالهاتف: 920000000 | البريد: info@ft.sa"
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("اسم البطاقة مطلوب");
    try {
      if (editingId) {
        await updateType.mutateAsync({ id: editingId, ...formData });
        toast.success("تم التحديث");
      } else {
        await create.mutateAsync(formData);
        toast.success("تمت الإضافة");
      }
      setDialogOpen(false);
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleDelete = async (id: string) => {
    const itemName = items?.find((i: any) => i.id === id)?.name || "";
    const confirmed = await confirm("تأكيد الحذف", `هل تريد حذف نوع البطاقة "${itemName}"؟`, true);
    if (!confirmed) return;
    try { await remove.mutateAsync(id); toast.success("تم الحذف"); } catch { toast.error("فشل الحذف"); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة"); return; }
    setUploadingId(id);
    try {
      const compressed = await compressImage(file, 600, 0.8);
      const data = new FormData();
      data.append('file', compressed, `card-type-logos_${id}.jpg`);
      const { data: uploadData } = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await updateLogo.mutateAsync({ id, logo_url: uploadData.url + "?t=" + Date.now() });
      toast.success("تم رفع الشعار");
    } catch { toast.error("فشل رفع الشعار"); } finally { setUploadingId(null); if (logoInputRef.current) logoInputRef.current.value = ""; }
  };

  const handleTogglePin = async (item: any) => {
    try {
      const newEnabled = !item.pin_enabled;
      await updatePin.mutateAsync({ id: item.id, pin_enabled: newEnabled, pin_code: newEnabled ? (item.pin_code || "0000") : item.pin_code });
      toast.success(newEnabled ? "تم تفعيل رمز الحماية" : "تم تعطيل رمز الحماية");
    } catch { toast.error("فشل التحديث"); }
  };

  const handleSaveCardPin = async (id: string) => {
    if (!/^\d{4}$/.test(editPinValue)) { toast.error("يجب أن يكون الرمز 4 أرقام"); return; }
    try {
      await updatePin.mutateAsync({ id, pin_enabled: true, pin_code: editPinValue });
      toast.success("تم حفظ الرمز");
      setEditingPinId(null);
      setEditPinValue("");
    } catch { toast.error("فشل الحفظ"); }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <ConfirmDialog {...dialogProps} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">أنواع البطاقات</h2>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 ml-1" /> إضافة نوع بطاقة
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">💡 يمكنك تخصيص عنوان البطاقة، اسم الشركة، والنصوص السفلية لكل نوع.</p>

      {isLoading ? (
        <SettingsSkeleton />
      ) : !items?.length ? (
        <p className="text-muted-foreground text-sm">لا توجد أنواع بعد</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الشعار</TableHead>
              {!isGlobalEnabled && <TableHead>رمز الحماية</TableHead>}
              <TableHead className="w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i: any) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {i.logo_url ? <img src={i.logo_url} alt="شعار" className="w-10 h-10 object-contain rounded border border-border bg-white" /> : (
                      <div className="w-10 h-10 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center bg-white"><ImageIcon className="w-4 h-4 text-muted-foreground/50" /></div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={(e) => handleLogoUpload(e, i.id)} disabled={uploadingId === i.id} />
                      <span className="text-xs text-primary hover:underline">{uploadingId === i.id ? "جارٍ..." : i.logo_url ? "تغيير" : "رفع شعار"}</span>
                    </label>
                  </div>
                </TableCell>
                {!isGlobalEnabled && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={!!i.pin_enabled} onCheckedChange={() => handleTogglePin(i)} disabled={updatePin.isPending} />
                      {i.pin_enabled && (
                        editingPinId === i.id ? (
                          <div className="flex gap-1 items-center">
                            <Input
                              value={editPinValue}
                              onChange={(e) => setEditPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              maxLength={4}
                              className="w-20 h-8 font-mono text-center tracking-widest"
                              dir="ltr"
                              autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleSaveCardPin(i.id)}><Check className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingPinId(null); setEditPinValue(""); }}><X className="w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingPinId(i.id); setEditPinValue(i.pin_code || ""); }} className="text-xs font-mono text-muted-foreground hover:text-foreground">
                            {i.pin_code || "0000"} ✏️
                          </button>
                        )
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(i)} className="text-primary hover:bg-primary/10">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل إعدادات البطاقة" : "إضافة نوع بطاقة جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>اسم نوع البطاقة (مثال: موظف، مقاول)</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="مثال: موظف رسمي" />
            </div>
            <div className="grid gap-2">
              <Label>عنوان البطاقة (يظهر تحت الشعار)</Label>
              <Input value={formData.card_title} onChange={(e) => setFormData({ ...formData, card_title: e.target.value })} placeholder="مثال: بطاقة موظف" />
            </div>
            <div className="grid gap-2">
              <Label>اسم الشركة (بجانب الشعار)</Label>
              <Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="مثال: شركة المستقبل" />
            </div>
            <div className="grid gap-2">
              <Label>النص السفلي (رابط الموقع)</Label>
              <Input value={formData.website_text} onChange={(e) => setFormData({ ...formData, website_text: e.target.value })} placeholder="www.example.com" dir="ltr" className="text-right" />
            </div>
            <div className="grid gap-2">
              <Label>تعليمات الظهر ومعلومات التواصل</Label>
              <Textarea 
                value={formData.back_instructions} 
                onChange={(e) => setFormData({ ...formData, back_instructions: e.target.value })} 
                placeholder="هذه البطاقة ملك لشركة..." 
                rows={3} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending || updateType.isPending}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DestructionReasonsSection() {
  const [name, setName] = useState("");
  const { data: items, isLoading } = useDestructionReasons();
  const create = useCreateDestructionReason();
  const remove = useDeleteDestructionReason();
  const { confirm, dialogProps } = useConfirmDialog();

  const handleAdd = async () => {
    if (!name.trim()) return;
    try { await create.mutateAsync(name); setName(""); toast.success("تمت إضافة سبب الإتلاف"); } catch { toast.error("فشل الإضافة"); }
  };

  const handleDelete = async (id: string) => {
    const itemName = items?.find((i) => i.id === id)?.name || "";
    const confirmed = await confirm("تأكيد الحذف", `هل تريد حذف سبب الإتلاف "${itemName}"؟`, true);
    if (!confirmed) return;
    try { await remove.mutateAsync(id); toast.success("تم الحذف"); } catch { toast.error("فشل الحذف"); }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <ConfirmDialog {...dialogProps} />
      <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-accent" /><h2 className="text-lg font-bold text-foreground">أسباب الإتلاف</h2></div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="سبب الإتلاف" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button onClick={handleAdd} disabled={create.isPending || !name.trim()} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /> إضافة</Button>
      </div>
      {isLoading ? (
        <SettingsSkeleton />
      ) : !items?.length ? (
        <p className="text-muted-foreground text-sm">لا توجد أسباب بعد</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>السبب</TableHead><TableHead className="w-20">حذف</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function CardsSettingsPage() {
  const { role } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">أنواع البطاقات وإعداداتها</h1>
        </div>
        <div className="space-y-6">
          {role === "admin" && <QrPinSection />}
          <CardTypesSection />
          <DestructionReasonsSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
