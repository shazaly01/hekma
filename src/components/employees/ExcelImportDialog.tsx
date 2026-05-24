import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { logAudit } from "@/hooks/useAuditLog";

interface ParsedEmployee {
  name: string;
  english_name?: string;
  employee_number?: string;
  department?: string;
  section?: string;
  job_title?: string;
  nationality?: string;
  passport_number?: string;
  card_number?: string;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COLUMN_MAP: Record<string, string> = {
  "الاسم": "name",
  "name": "name",
  "الاسم الانجليزي": "english_name",
  "english_name": "english_name",
  "الرقم الوظيفي": "employee_number",
  "employee_number": "employee_number",
  "الإدارة": "department",
  "department": "department",
  "القسم": "section",
  "section": "section",
  "الوظيفة": "job_title",
  "job_title": "job_title",
  "الجنسية": "nationality",
  "nationality": "nationality",
  "رقم الجواز": "passport_number",
  "passport_number": "passport_number",
  "الرقم الوطني": "card_number",
  "card_number": "card_number",
};

export default function ExcelImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const [rows, setRows] = useState<ParsedEmployee[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImported(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const parsed: ParsedEmployee[] = json.map((row) => {
        const mapped: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          const normalizedKey = key.trim().toLowerCase();
          for (const [label, field] of Object.entries(COLUMN_MAP)) {
            if (label.toLowerCase() === normalizedKey || field === normalizedKey) {
              mapped[field] = String(value).trim();
            }
          }
        }

        const emp: ParsedEmployee = {
          name: mapped.name || "",
          english_name: mapped.english_name,
          employee_number: mapped.employee_number,
          department: mapped.department,
          section: mapped.section,
          job_title: mapped.job_title,
          nationality: mapped.nationality,
          passport_number: mapped.passport_number,
          card_number: mapped.card_number,
        };

        if (!emp.name || emp.name.length < 2) {
          emp.error = "الاسم مطلوب (حرفين على الأقل)";
        }
        return emp;
      });

      setRows(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const valid = rows.filter((r) => !r.error);
    if (valid.length === 0) {
      toast.error("لا توجد بيانات صالحة للاستيراد");
      return;
    }

    setImporting(true);
    const toInsert = valid.map(({ error, ...r }) => r);
    
    let data: any[] = [];
    let error: any = null;
    try {
      const res = await api.post("/employees/bulk", { data: toInsert });
      data = res.data;
    } catch (e: any) {
      error = e.response?.data?.error || e.message;
    }

    if (error) {
      toast.error("فشل الاستيراد: " + error);
    } else {
      toast.success(`تم استيراد ${data.length} موظف بنجاح`);
      logAudit("create", "employee_bulk_import", undefined, { count: data.length });
      setImported(true);
      onSuccess();
    }
    setImporting(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setRows([]);
      setImported(false);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(o);
  };

  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.filter((r) => r.error).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            استيراد موظفين من Excel
          </DialogTitle>
          <DialogDescription>
            ارفع ملف Excel يحتوي على أعمدة: الاسم، الاسم الانجليزي، الرقم الوظيفي، الإدارة، القسم، الوظيفة، الجنسية
          </DialogDescription>
        </DialogHeader>

        {!rows.length && !imported && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              اختر ملف Excel
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {rows.length > 0 && !imported && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-success flex items-center gap-1">
                <Check className="w-4 h-4" /> {validCount} صالح
              </span>
              {errorCount > 0 && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errorCount} خطأ
                </span>
              )}
            </div>
            <div className="max-h-60 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم الوظيفي</TableHead>
                    <TableHead>الإدارة</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r.error ? "bg-destructive/5" : ""}>
                      <TableCell className="text-sm">{r.name || "—"}</TableCell>
                      <TableCell className="text-sm" dir="ltr">{r.employee_number || "—"}</TableCell>
                      <TableCell className="text-sm">{r.department || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {r.error ? (
                          <span className="text-destructive">{r.error}</span>
                        ) : (
                          <span className="text-success">✓</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setRows([]); if (fileRef.current) fileRef.current.value = ""; }}>
                إلغاء
              </Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0} className="gradient-primary text-primary-foreground">
                {importing ? "جارٍ الاستيراد..." : `استيراد ${validCount} موظف`}
              </Button>
            </div>
          </>
        )}

        {imported && (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-foreground font-medium">تم الاستيراد بنجاح</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
