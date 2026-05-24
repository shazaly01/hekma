import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useEmployeeCards, useCreateEmployeeCard, useUpdateEmployeeCard, useDeleteEmployeeCard, useCardTypes, useDestructionReasons } from "@/hooks/useCards";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, permissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CreditCard, Plus, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardListSkeleton } from "@/components/ui/loading-skeletons";

interface Props {
  employeeId: string;
}

const ISSUE_TYPES = [
  { value: "new", label: "إصدار جديد" },
  { value: "renewal", label: "تجديد" },
  { value: "replacement", label: "بدل فاقد" },
];

const REASONS = [
  { value: "expiry", label: "انتهاء صلاحية" },
  { value: "lost", label: "ضياع" },
  { value: "damaged", label: "تلف" },
  { value: "other", label: "أخرى" },
];

export default function EmployeeCardsSection({ employeeId }: Props) {
  const { role, user } = useAuth();
  const { data: cards = [], isLoading } = useEmployeeCards(employeeId);
  const { data: cardTypes = [] } = useCardTypes();
  const { data: destructionReasons = [] } = useDestructionReasons();
  const createCard = useCreateEmployeeCard();
  const updateCard = useUpdateEmployeeCard();
  const deleteCard = useDeleteEmployeeCard();
  const canEdit = hasPermission(role, permissions.cardEdit);
  const canCreate = hasPermission(role, permissions.cardCreate);
  const canDeleteCard = user?.is_super_admin === true;
  const { confirm, dialogProps } = useConfirmDialog();

  const [open, setOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [destroyCardId, setDestroyCardId] = useState("");
  const [form, setForm] = useState({
    card_type_id: "",
    issue_type: "new" as string,
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    reason: "",
    old_card_returned: false,
    non_return_reason: "",
    notes: "",
  });
  const [destroyForm, setDestroyForm] = useState({
    destruction_reason_id: "",
    destruction_date: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => {
    setForm({
      card_type_id: "",
      issue_type: "new",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      reason: "",
      old_card_returned: false,
      non_return_reason: "",
      notes: "",
    });
  };

  const handleCreate = async () => {
    if (!form.card_type_id) {
      toast.error("يرجى اختيار نوع البطاقة");
      return;
    }

    if (!form.issue_date) {
      toast.error("تاريخ الإصدار مطلوب أو غير صالح");
      return;
    }

    const issueDate = new Date(form.issue_date);
    if (isNaN(issueDate.getTime())) {
      toast.error("تاريخ الإصدار غير صالح. يرجى إدخال تاريخ صحيح.");
      return;
    }

    if (!form.expiry_date) {
      toast.error("تاريخ الانتهاء مطلوب أو غير صالح");
      return;
    }

    const expiryDate = new Date(form.expiry_date);
    if (isNaN(expiryDate.getTime())) {
      toast.error("تاريخ الانتهاء غير صالح. يرجى إدخال تاريخ صحيح.");
      return;
    }
    if (expiryDate <= issueDate) {
      toast.error("تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار");
      return;
    }

    try {
      await createCard.mutateAsync({
        employee_id: employeeId,
        card_type_id: form.card_type_id,
        issue_type: form.issue_type,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date || null,
        reason: form.reason || null,
        old_card_returned: form.old_card_returned,
        non_return_reason: form.non_return_reason || null,
        notes: form.notes || null,
      });
      toast.success("تم إصدار البطاقة بنجاح");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("حدث خطأ أثناء الإصدار");
    }
  };

  const handleDestroy = async () => {
    if (!destroyForm.destruction_reason_id) {
      toast.error("يرجى اختيار سبب الإتلاف");
      return;
    }
    try {
      await updateCard.mutateAsync({
        id: destroyCardId,
        employee_id: employeeId,
        is_destroyed: true,
        destruction_reason_id: destroyForm.destruction_reason_id,
        destruction_date: destroyForm.destruction_date,
      });
      toast.success("تم إتلاف البطاقة");
      setDestroyOpen(false);
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleDeleteCard = async (id: string) => {
    const confirmed = await confirm("حذف البطاقة", "هل أنت متأكد من حذف هذه البطاقة نهائياً؟", true);
    if (!confirmed) return;
    try {
      await deleteCard.mutateAsync({ id, employee_id: employeeId });
      toast.success("تم حذف البطاقة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const showRenewalFields = form.issue_type === "renewal" || form.issue_type === "replacement";

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            البطاقات ({cards.length})
          </h2>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إصدار بطاقة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إصدار بطاقة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>نوع البطاقة *</Label>
                  <Select value={form.card_type_id} onValueChange={(v) => setForm(p => ({ ...p, card_type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر نوع البطاقة" /></SelectTrigger>
                    <SelectContent>
                      {cardTypes.map(ct => (
                        <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع الإصدار</Label>
                  <Select value={form.issue_type} onValueChange={(v) => setForm(p => ({ ...p, issue_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showRenewalFields && (
                  <>
                    <div className="space-y-2">
                      <Label>السبب</Label>
                      <Select value={form.reason} onValueChange={(v) => setForm(p => ({ ...p, reason: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                        <SelectContent>
                          {REASONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="old_returned"
                        checked={form.old_card_returned}
                        onCheckedChange={(v) => setForm(p => ({ ...p, old_card_returned: !!v }))}
                      />
                      <Label htmlFor="old_returned">تم استلام البطاقة القديمة</Label>
                    </div>

                    {!form.old_card_returned && (
                      <div className="space-y-2">
                        <Label>سبب عدم الاستلام</Label>
                        <Input
                          value={form.non_return_reason}
                          onChange={(e) => setForm(p => ({ ...p, non_return_reason: e.target.value }))}
                          placeholder="مثال: ضياع"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>تاريخ الإصدار</Label>
                    <Input type="date" value={form.issue_date} onChange={(e) => setForm(p => ({ ...p, issue_date: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الانتهاء</Label>
                    <Input type="date" value={form.expiry_date} onChange={(e) => setForm(p => ({ ...p, expiry_date: e.target.value }))} dir="ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <Button onClick={handleCreate} disabled={createCard.isPending} className="w-full gradient-primary text-primary-foreground">
                  {createCard.isPending ? "جارٍ الحفظ..." : "إصدار البطاقة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Destroy dialog */}
      <Dialog open={destroyOpen} onOpenChange={setDestroyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إتلاف بطاقة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>سبب الإتلاف *</Label>
              <Select value={destroyForm.destruction_reason_id} onValueChange={(v) => setDestroyForm(p => ({ ...p, destruction_reason_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                <SelectContent>
                  {destructionReasons.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ الإتلاف</Label>
              <Input type="date" value={destroyForm.destruction_date} onChange={(e) => setDestroyForm(p => ({ ...p, destruction_date: e.target.value }))} dir="ltr" />
            </div>
            <Button onClick={handleDestroy} disabled={updateCard.isPending} variant="destructive" className="w-full">
              {updateCard.isPending ? "جارٍ..." : "تأكيد الإتلاف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cards list */}
      {isLoading ? (
        <CardListSkeleton count={2} />
      ) : cards.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا توجد بطاقات مصدرة</p>
      ) : (
        <div className="space-y-3">
          {cards.map((card: any) => {
            const isExpired = !card.is_destroyed && card.expiry_date && new Date(card.expiry_date) < new Date();
            return (
              <div key={card.id} className={`p-4 rounded-lg border ${card.is_destroyed ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">
                        {card.card_types?.name || "بطاقة"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {ISSUE_TYPES.find(t => t.value === card.issue_type)?.label || card.issue_type}
                      </Badge>
                      {card.is_destroyed && (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="w-3 h-3 ml-1" />
                          متلفة
                        </Badge>
                      )}
                      {isExpired && !card.is_destroyed && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          منتهية
                        </Badge>
                      )}
                      {!isExpired && !card.is_destroyed && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          سارية
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>تاريخ الإصدار: {formatDate(card.issue_date)}</p>
                      {card.expiry_date && (
                        <p>تاريخ الانتهاء: {formatDate(card.expiry_date)}</p>
                      )}
                      {card.reason && (
                        <p>السبب: {REASONS.find(r => r.value === card.reason)?.label || card.reason}</p>
                      )}
                      {(card.issue_type === "renewal" || card.issue_type === "replacement") && (
                        <p>
                          استلام القديمة: {card.old_card_returned ? "نعم" : `لا${card.non_return_reason ? ` - ${card.non_return_reason}` : ""}`}
                        </p>
                      )}
                      {card.is_destroyed && card.destruction_reasons?.name && (
                        <p>سبب الإتلاف: {card.destruction_reasons.name}</p>
                      )}
                      {card.is_destroyed && card.destruction_date && (
                        <p>تاريخ الإتلاف: {formatDate(card.destruction_date)}</p>
                      )}
                      {card.notes && <p>ملاحظات: {card.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && !card.is_destroyed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive text-xs"
                        onClick={() => {
                          setDestroyCardId(card.id);
                          setDestroyForm({
                            destruction_reason_id: "",
                            destruction_date: new Date().toISOString().split("T")[0],
                          });
                          setDestroyOpen(true);
                        }}
                      >
                        إتلاف
                      </Button>
                    )}
                    {canDeleteCard && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteCard(card.id)}
                        title="حذف البطاقة نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
