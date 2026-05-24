import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, Users, CreditCard, FileText, Bell, QrCode, ClipboardList, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Users, title: "إدارة الموظفين", desc: "إضافة وتعديل وحذف بيانات الموظفين مع دعم الصور والمرفقات" },
  { icon: CreditCard, title: "إدارة البطاقات", desc: "إصدار وتجديد واستبدال وإتلاف بطاقات الموظفين مع تتبع كامل" },
  { icon: FileText, title: "التقارير", desc: "تقارير شاملة للبطاقات والموظفين مع تصدير PDF و Excel" },
  { icon: Bell, title: "الإشعارات", desc: "تنبيهات تلقائية عند اقتراب انتهاء صلاحية البطاقات" },
  { icon: QrCode, title: "رمز QR", desc: "توليد رموز QR للتحقق من هوية الموظف عبر صفحة عامة" },
  { icon: ClipboardList, title: "سجل النشاطات", desc: "تتبع جميع العمليات التي يقوم بها المستخدمون في النظام" },
  { icon: Shield, title: "الأدوار والصلاحيات", desc: "ثلاثة مستويات: مشرف، مدخل بيانات، عارض" },
  { icon: Settings, title: "الإعدادات", desc: "إدارة الإدارات والوظائف والجنسيات وأنواع البطاقات" },
];

export default function AboutPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">نظام إدارة بطاقات الموظفين</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
            نظام متكامل لإدارة بطاقات تعريف الموظفين، يتيح إصدار البطاقات وتجديدها وتتبع صلاحيتها
            مع توليد رموز QR للتحقق الفوري من الهوية.
          </p>
          <p className="text-xs text-muted-foreground/60">الإصدار 1.0</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <f.icon className="w-4 h-4 text-primary" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">دليل الاستخدام السريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">1.</strong> أضف الإدارات والوظائف من صفحة <strong className="text-foreground">الإعدادات</strong>.</p>
            <p><strong className="text-foreground">2.</strong> أضف الموظفين من صفحة <strong className="text-foreground">إضافة موظف</strong> أو عبر استيراد ملف Excel.</p>
            <p><strong className="text-foreground">3.</strong> أصدر بطاقات للموظفين من صفحة تفاصيل الموظف.</p>
            <p><strong className="text-foreground">4.</strong> تابع التنبيهات من <strong className="text-foreground">الإشعارات</strong> لمعرفة البطاقات القريبة من الانتهاء.</p>
            <p><strong className="text-foreground">5.</strong> استخدم <strong className="text-foreground">التقارير</strong> لتصدير بيانات مفصلة بصيغة PDF أو Excel.</p>
          </CardContent>
        </Card>
        <Card className="border-border mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-sm font-bold text-primary">تم تطوير وبرمجة هذا النظام بواسطة</h3>
            <div className="flex flex-col items-center justify-center gap-3">
              <img src="/core-libya-logo.png" alt="شركة كور ليبيا" className="h-20 object-contain" />
              <p className="text-sm font-semibold text-foreground">شركة كور ليبيا للاتصالات وتقنية المعلومات</p>
            </div>
            <p className="text-xs text-muted-foreground">
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
