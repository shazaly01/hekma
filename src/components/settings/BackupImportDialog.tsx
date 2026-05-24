import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { importBackup, ImportMode, ImportResult } from "@/lib/importBackup";
import { useQueryClient } from "@tanstack/react-query";

const modeOptions: { value: ImportMode; label: string; description: string; icon: string }[] = [
  { value: "replace", label: "استبدال كامل", description: "حذف جميع البيانات الحالية واستبدالها ببيانات الملف", icon: "🔄" },
  { value: "merge", label: "دمج مع التحديث", description: "إضافة السجلات الجديدة وتحديث الموجودة بناءً على المعرف", icon: "🔀" },
  { value: "add_only", label: "إضافة فقط", description: "إضافة السجلات غير الموجودة فقط وتجاهل المكررات", icon: "➕" },
];

export default function BackupImportDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const reset = () => {
    setResults(null);
    setProgress("");
    setConfirmReplace(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel (.xlsx)");
      return;
    }

    if (mode === "replace" && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    await runImport(file);
  };

  const runImport = async (file?: File) => {
    const f = file || fileRef.current?.files?.[0];
    if (!f) return;

    setLoading(true);
    setResults(null);
    setProgress("جارٍ قراءة الملف...");

    try {
      const importResults = await importBackup(f, mode, setProgress);
      setResults(importResults);

      const successCount = importResults.filter((r) => r.status === "success").length;
      const errorCount = importResults.filter((r) => r.status === "error").length;

      if (errorCount === 0) {
        toast.success(`تم الاستيراد بنجاح (${successCount} جدول)`);
      } else {
        toast.warning(`تم الاستيراد مع ${errorCount} أخطاء`);
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "فشل الاستيراد");
    } finally {
      setLoading(false);
      setProgress("");
      setConfirmReplace(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          استيراد نسخة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            استيراد نسخة احتياطية
          </DialogTitle>
        </DialogHeader>

        {/* Mode selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">طريقة الاستيراد:</p>
          <div className="space-y-2">
            {modeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  mode === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value={opt.value}
                  checked={mode === opt.value}
                  onChange={() => { setMode(opt.value); setConfirmReplace(false); }}
                  className="mt-1"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium">{opt.icon} {opt.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Replace warning */}
        {mode === "replace" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              تحذير: سيتم حذف جميع البيانات الحالية نهائياً واستبدالها ببيانات الملف المستورد. تأكد من أن لديك نسخة احتياطية حديثة.
            </p>
          </div>
        )}

        {/* Confirm replace step */}
        {confirmReplace && mode === "replace" && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-destructive">هل أنت متأكد من استبدال جميع البيانات؟</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => runImport()} disabled={loading}>
                نعم، استبدال الكل
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setConfirmReplace(false); if (fileRef.current) fileRef.current.value = ""; }}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* File input */}
        {!confirmReplace && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            <p className="text-sm font-medium text-foreground">نتائج الاستيراد:</p>
            {results.map((r) => (
              <div key={r.table} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                {r.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                {r.status === "skipped" && <span className="text-muted-foreground text-xs">—</span>}
                {r.status === "error" && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                <span className="font-medium">{r.sheetName}</span>
                <span className="text-muted-foreground text-xs">
                  {r.status === "success" && `${r.count} سجل`}
                  {r.status === "skipped" && r.message}
                  {r.status === "error" && r.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
