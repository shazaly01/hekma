import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, X, FileDown } from "lucide-react";
import type { DateRange } from "@/lib/reportUtils";
import { fmtDate } from "@/lib/reportUtils";

export function DateRangePicker({
  value, onChange, label: labelProp
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = value.from && value.to
    ? `${fmtDate(value.from)} — ${fmtDate(value.to)}`
    : value.from ? `من ${fmtDate(value.from)}` : (labelProp || "تحديد نطاق تاريخ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("gap-2 text-sm h-9", (!value.from && !value.to) && "text-muted-foreground")}>
          <CalendarIcon className="w-4 h-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={{ from: value.from, to: value.to }}
          onSelect={(r) => onChange({ from: r?.from, to: r?.to })}
          numberOfMonths={2}
          className="p-3 pointer-events-auto"
        />
        <div className="flex justify-end gap-2 p-3 border-t border-border">
          <Button size="sm" variant="ghost" onClick={() => { onChange({ from: undefined, to: undefined }); setOpen(false); }}>
            مسح
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>تطبيق</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FilterSelect({
  value, onChange, options, placeholder
}: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm min-w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">الكل</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FiltersPanel({
  title,
  children,
  activeCount,
  onClear,
  onPrint,
  printLabel,
}: {
  title: string;
  children: React.ReactNode;
  activeCount: number;
  onClear: () => void;
  onPrint?: () => void;
  printLabel?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <Filter className="w-4 h-4 text-accent" />
        <span>{title}</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs">{activeCount}</Badge>
        )}
        {activeCount > 0 && (
          <button onClick={onClear} className="mr-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X className="w-3 h-3" /> مسح الفلاتر
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {children}
      </div>
      {onPrint && (
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <Button size="sm" onClick={onPrint} className="gap-2">
            <FileDown className="w-4 h-4" />
            {printLabel || "طباعة التقرير"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReportSection({
  icon, title, count, children, emptyMsg, onPrint, onExcel,
}: {
  icon: React.ReactNode; title: string; count: number;
  children?: React.ReactNode; emptyMsg?: string; onPrint?: () => void; onExcel?: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Badge variant="secondary">{count}</Badge>
        <div className="mr-auto flex gap-2">
          {onExcel && (
            <Button size="sm" variant="outline" onClick={onExcel} className="gap-1.5">
              <FileDown className="w-3.5 h-3.5" />
              Excel
            </Button>
          )}
          {onPrint && (
            <Button size="sm" variant="outline" onClick={onPrint} className="gap-1.5">
              <FileDown className="w-3.5 h-3.5" />
              طباعة
            </Button>
          )}
        </div>
      </div>
      {count === 0
        ? <p className="text-sm text-muted-foreground text-center py-6">{emptyMsg || "لا توجد بيانات"}</p>
        : <div className="space-y-2">{children}</div>
      }
    </div>
  );
}
