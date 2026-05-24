import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Building2, Briefcase, Globe, Pencil, Check, X, Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/compressImage";
import { exportBackup } from "@/lib/exportBackup";
import BackupImportDialog from "@/components/settings/BackupImportDialog";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingsSkeleton } from "@/components/ui/loading-skeletons";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import {
  useDepartments, useCreateDepartment, useDeleteDepartment, useUpdateDepartment,
  useSections, useCreateSection, useDeleteSection, useUpdateSection,
  useJobTitles, useCreateJobTitle, useDeleteJobTitle, useUpdateJobTitle,
  useNationalities, useCreateNationality, useDeleteNationality, useUpdateNationality,
} from "@/hooks/useSettings";
import { hasPermission, permissions } from "@/lib/permissions";

function EditableRow({ item, onSave, onDelete }: { item: { id: string; name: string }; onSave: (id: string, name: string) => Promise<void>; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === item.name) { setEditing(false); setName(item.name); return; }
    try {
      await onSave(item.id, name.trim());
      setEditing(false);
      toast.success("تم التحديث");
    } catch {
      toast.error("فشل التحديث");
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {editing ? (
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} className="h-8" autoFocus />
        ) : (
          item.name
        )}
      </TableCell>
      <TableCell className="w-24">
        <div className="flex gap-1">
          {editing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} className="text-success hover:text-success h-8 w-8"><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setName(item.name); }} className="text-muted-foreground h-8 w-8"><X className="w-4 h-4" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function EditableDepartmentRow({ item, onSave, onDelete }: { item: { id: string; name: string; color: string | null }; onSave: (id: string, name: string, color: string) => Promise<void>; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color || "#1a5b9c");

  const handleSave = async () => {
    if (!name.trim()) return;
    try { await onSave(item.id, name, color); setEditing(false); toast.success("تم التحديث"); } catch { toast.error("فشل التحديث"); }
  };

  return (
    <TableRow>
      <TableCell>
        {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} className="h-8" /> : <span className="font-medium">{item.name}</span>}
      </TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <span className="text-xs text-muted-foreground uppercase">{color}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: item.color || "#1a5b9c" }} />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end">
          {editing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} className="text-success hover:text-success h-8 w-8"><Check className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(false); setName(item.name); setColor(item.color || "#1a5b9c"); }} className="text-muted-foreground h-8 w-8"><X className="w-4 h-4" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function DepartmentsSection({ items, isLoading, onAdd, onDelete, onUpdate }: {
  items: { id: string; name: string; color: string | null }[] | undefined; isLoading: boolean;
  onAdd: (name: string, color: string) => Promise<void>; onDelete: (id: string) => void; onUpdate: (id: string, name: string, color: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1a5b9c");
  const { confirm, dialogProps } = useConfirmDialog();

  const handleAdd = async () => {
    if (!name.trim()) return;
    try { await onAdd(name, color); setName(""); setColor("#1a5b9c"); toast.success("تمت الإضافة"); } catch { toast.error("فشل الإضافة"); }
  };

  const handleDelete = async (id: string) => {
    const itemName = items?.find((i) => i.id === id)?.name || "";
    const confirmed = await confirm("تأكيد الحذف", `هل تريد حذف "${itemName}"؟ لا يمكن التراجع عن هذا الإجراء.`, true);
    if (confirmed) onDelete(id);
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <ConfirmDialog {...dialogProps} />
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">الإدارات (مع تخصيص الألوان)</h2>
      </div>
      <div className="flex gap-2 mb-4 items-center">
        <Input placeholder="اسم الإدارة الجديدة..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="flex-1" />
        <div className="flex items-center gap-2 border border-input rounded-md px-2 h-10 bg-background">
          <label className="text-xs text-muted-foreground whitespace-nowrap">اللون:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
        </div>
        <Button onClick={handleAdd} disabled={!name.trim()} className="gradient-primary text-primary-foreground whitespace-nowrap"><Plus className="w-4 h-4 ml-1" /> إضافة</Button>
      </div>
      {isLoading ? (
        <SettingsSkeleton />
      ) : !items?.length ? (
        <p className="text-muted-foreground text-sm">لا توجد إدارات بعد</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="w-24">اللون</TableHead><TableHead className="w-24">إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((item) => (
              <EditableDepartmentRow key={item.id} item={item} onSave={onUpdate} onDelete={handleDelete} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SettingsSection({ title, icon: Icon, items, isLoading, onAdd, onDelete, onUpdate, addPlaceholder }: {
  title: string; icon: typeof Building2; items: { id: string; name: string }[] | undefined; isLoading: boolean;
  onAdd: (name: string) => Promise<void>; onDelete: (id: string) => void; onUpdate: (id: string, name: string) => Promise<void>; addPlaceholder: string;
}) {
  const [name, setName] = useState("");
  const { confirm, dialogProps } = useConfirmDialog();

  const handleAdd = async () => {
    if (!name.trim()) return;
    try { await onAdd(name); setName(""); toast.success("تمت الإضافة"); } catch { toast.error("فشل الإضافة"); }
  };

  const handleDelete = async (id: string) => {
    const itemName = items?.find((i) => i.id === id)?.name || "";
    const confirmed = await confirm("تأكيد الحذف", `هل تريد حذف "${itemName}"؟ لا يمكن التراجع عن هذا الإجراء.`, true);
    if (confirmed) onDelete(id);
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <ConfirmDialog {...dialogProps} />
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="flex gap-2 mb-4">
        <Input placeholder={addPlaceholder} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button onClick={handleAdd} disabled={!name.trim()} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /> إضافة</Button>
      </div>
      {isLoading ? (
        <SettingsSkeleton />
      ) : !items?.length ? (
        <p className="text-muted-foreground text-sm">لا توجد عناصر بعد</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="w-24">إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((item) => (
              <EditableRow key={item.id} item={item} onSave={onUpdate} onDelete={handleDelete} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SectionsSection() {
  const { data: departments = [] } = useDepartments();
  const { data: sections, isLoading } = useSections();
  const create = useCreateSection();
  const remove = useDeleteSection();
  const update = useUpdateSection();
  const [name, setName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const { confirm, dialogProps } = useConfirmDialog();

  const handleAdd = async () => {
    if (!name.trim() || !selectedDeptId) return;
    try { 
      await create.mutateAsync({ name, department_id: selectedDeptId }); 
      setName(""); 
      toast.success("تمت الإضافة"); 
    } catch { toast.error("فشل الإضافة"); }
  };

  const handleDelete = async (id: string) => {
    const itemName = sections?.find((i) => i.id === id)?.name || "";
    const confirmed = await confirm("تأكيد الحذف", `هل تريد حذف القسم "${itemName}"؟`, true);
    if (confirmed) {
      try {
        await remove.mutateAsync(id);
        toast.success("تم الحذف");
      } catch { toast.error("فشل الحذف"); }
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6 mt-6">
      <ConfirmDialog {...dialogProps} />
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-bold text-foreground">الأقسام</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
        >
          <option value="">اختر الإدارة...</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <Input 
          placeholder="اسم القسم الجديد" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && handleAdd()} 
        />
        <Button onClick={handleAdd} disabled={!name.trim() || !selectedDeptId || create.isPending} className="gradient-primary text-primary-foreground whitespace-nowrap">
          <Plus className="w-4 h-4 ml-1" /> إضافة
        </Button>
      </div>
      
      {isLoading ? (
        <SettingsSkeleton />
      ) : !sections?.length ? (
        <p className="text-muted-foreground text-sm">لا توجد أقسام بعد</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>القسم</TableHead>
              <TableHead>الإدارة</TableHead>
              <TableHead className="w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((sec) => {
              const deptName = departments.find(d => d.id === sec.department_id)?.name || "—";
              return (
                <TableRow key={sec.id}>
                  <TableCell className="font-medium">{sec.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{deptName}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sec.id)} className="text-destructive hover:text-destructive h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { role } = useAuth();
  const canImportBackup = hasPermission(role as any, permissions.backupImport);
  const canManageSettings = hasPermission(role as any, permissions.settingsManage);
  const [backupLoading, setBackupLoading] = useState(false);

  const { data: departments, isLoading: dLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();
  const updateDept = useUpdateDepartment();

  const { data: jobTitles, isLoading: jLoading } = useJobTitles();
  const createJob = useCreateJobTitle();
  const deleteJob = useDeleteJobTitle();
  const updateJob = useUpdateJobTitle();

  const { data: nationalities, isLoading: nLoading } = useNationalities();
  const createNat = useCreateNationality();
  const deleteNat = useDeleteNationality();
  const updateNat = useUpdateNationality();

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await exportBackup();
      toast.success("تم تصدير النسخة الاحتياطية بنجاح");
    } catch {
      toast.error("فشل تصدير النسخة الاحتياطية");
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
          {canManageSettings && (
            <div className="flex gap-2">
              {canImportBackup && <BackupImportDialog />}
              <Button onClick={handleBackup} disabled={backupLoading} variant="outline" className="gap-2">
                {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {backupLoading ? "جارٍ التصدير..." : "نسخة احتياطية"}
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <DepartmentsSection
            items={departments} isLoading={dLoading}
            onAdd={async (name, color) => { await createDept.mutateAsync({ name, color }); }}
            onDelete={(id) => deleteDept.mutateAsync(id).then(() => toast.success("تم الحذف")).catch(() => toast.error("فشل الحذف"))}
            onUpdate={async (id, name, color) => { await updateDept.mutateAsync({ id, name, color }); }}
          />
          <SectionsSection />
          <SettingsSection
            title="الوظائف" icon={Briefcase} items={jobTitles} isLoading={jLoading} addPlaceholder="اسم الوظيفة الجديدة"
            onAdd={async (n) => { await createJob.mutateAsync(n); }}
            onDelete={(id) => deleteJob.mutateAsync(id).then(() => toast.success("تم الحذف")).catch(() => toast.error("فشل الحذف"))}
            onUpdate={async (id, name) => { await updateJob.mutateAsync({ id, name }); }}
          />
          <SettingsSection
            title="الجنسيات" icon={Globe} items={nationalities} isLoading={nLoading} addPlaceholder="اسم الجنسية"
            onAdd={async (n) => { await createNat.mutateAsync(n); }}
            onDelete={(id) => deleteNat.mutateAsync(id).then(() => toast.success("تم الحذف")).catch(() => toast.error("فشل الحذف"))}
            onUpdate={async (id, name) => { await updateNat.mutateAsync({ id, name }); }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
