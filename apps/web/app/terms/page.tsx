'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Clock,
  AlertTriangle,
  Ban,
  Store,
  UserCheck,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      if (window.history.length > 1 && document.referrer) {
        router.back();
      } else {
        router.push('/auth/register');
      }
    }
  };

  const sections = [
    {
      id: 'acceptance',
      icon: UserCheck,
      title: '1. التسجيل والهوية الجامعية',
      content: [
        'منصة FastOrder مخصصة لخدمة مجتمع الحرم الجامعي (الطلاب، أعضاء هيئة التدريس، والعاملين بالأكشاك).',
        'يلتزم المستخدم بتقديم بيانات حقيقية وصحيحة تشمل الاسم، رقم الهاتف الفعّال، والكلية التابع لها داخل الجامعة.',
        'يتحمل صاحب الحساب المسؤولية الكاملة عن سرية بيانات تسجيل دخوله وكافة العمليات الصادرة من حسابه.',
        'يُحظر إنشاء حسابات وهمية أو استخدام أرقام هواتف غير مملوكة للمستخدم.',
      ],
    },
    {
      id: 'payments',
      icon: CreditCard,
      title: '2. طبيعة الدفع والتعاملات المالية',
      content: [
        'الدفع يتم مباشرة عند استلام الطلب من الكشك أو الكافيه داخل الحرم الجامعي.',
        'طرق الدفع المعتمدة حالياً هي: الدفع النقدي (كاش) أو المحافظ الإلكترونية المتفق عليها مع الكشك (مثل فودافون كاش أو إنستاباي).',
        'لا يتم خصم أي مبالغ إلكترونية مسبقة عبر بطاقات بنكية من خلال التطبيق في المرحلة الحالية.',
        'يلتزم الطالب بدفع القيمة الإجمالية المحددة في فاتورة الطلب دون أي زيادات غير معتمدة في المنيو.',
      ],
    },
    {
      id: 'cancellation',
      icon: Clock,
      title: '3. سياسة تعديل وإلغاء الطلبات',
      content: [
        'يحق للطالب إلغاء الطلب فقط أثناء حالة "قيد انتظار الكشك" (PENDING_KIOSK) قبل أن يقوم الكاشير بقبول الطلب.',
        'بمجرد قبول الكشك للطلب والبدء في التحضير، لا يمكن للطالب إلغاء الطلب نهائياً حرصاً على عدم إهدار الموارد والأطعمة الطازجة.',
        'يحق للكشك رفض الطلب في حال نفاد الأصناف أو حدوث ضغط تشغيلي استثنائي، مع إبلاغ الطالب فوراً بسبب الرفض.',
      ],
    },
    {
      id: 'no-show',
      icon: Ban,
      title: '4. سياسة عدم الحضور للاستلام وحظر الحساب المباشر (No-Show Policy)',
      isStrict: true,
      content: [
        'عند تجهيز الطلب وإرسال إشعار "جاهز للاستلام"، يلتزم الطالب بالتوجه فوراً إلى الكشك لاستلام طلبه وسداد قيمته.',
        'عدم الحضور لاستلام الأوردر (No-Show) حتى لمرة واحدة فقط يؤدي إلى حظر وتبنيد حساب الطالب فوراً وبشكل نهائي بدون سابق إنذار.',
        'تطبيق سياسة "أوردر واحد لم يتم استلامه = حظر فوري مباشر" لحماية حقوق أصحاب الأكشاك ومنع إهدار الطعام والمشروبات المجهزة خصيصاً.',
        'في حال حظر الحساب بسبب عدم الاستلام، لن يتمكن الطالب من تسجيل طلبات جديدة أو الاستفادة من خدمات التطبيق نهائياً.',
      ],
    },
    {
      id: 'wait-estimates',
      icon: AlertTriangle,
      title: '5. تقدير أوقات الانتظار ومؤشرات الطوابير',
      content: [
        'مؤشرات الطوابير وعدد الطلبات المتبقية ("حوالي X أوردرات قدامك") وأزمنة التحضير هي تقديرات ذكية تقريبية مبنية على سرعة التجهيز المعتادة.',
        'صُممت هذه المؤشرات لمساعدة الطلاب في تنظيم أوقاتهم وتجنب الانتظار الجسدي في الطوابير أثناء فترات الراحة بين المحاضرات.',
        'قد تتغير هذه المواعيد قليلاً خلال أوقات الذروة الاستثنائية، ويسعى فريق الكشك دائماً لتقليل زمن الانتظار إلى أقصى حد.',
      ],
    },
    {
      id: 'kiosk-responsibilities',
      icon: Store,
      title: '6. التزامات الأكشاك ومقدمي الخدمة',
      content: [
        'يلتزم الكشك بتقديم أطعمة ومشروبات مطابقة لمعايير الجودة والسلامة والنظافة المعتمدة من الجامعة.',
        'تخضع أصناف المنيو وأسعارها لمراجعة واعتماد مسبق من قِبل إدارة الحرم الجامعي قبل إتاحتها للطلب.',
        'يلتزم الكاشير بتحديث حالة توفر الأصناف في المنيو فور نفادها لمنع طلب أصناف غير متوفرة.',
      ],
    },
    {
      id: 'privacy',
      icon: ShieldCheck,
      title: '7. حماية البيانات والخصوصية',
      content: [
        'تلتزم منصة FastOrder بالحفاظ على سرية بياناتك الشخصية واستخدامها حصرياً داخل نطاق تيسير عمليات الطلب وإشعارات الخدمة.',
        'لا نقوم ببيع أو مشاركة بيانات الطلاب مع أي جهات خارجية أو إعلانية خارج نطاق الحرم الجامعي.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-canvas py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex items-center justify-between gap-4 bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-canvas border border-line flex items-center justify-center text-ink hover:bg-line/40 transition-colors"
              aria-label="الرجوع إلى صفحة التسجيل"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl text-ink">
                الشروط والأحكام وسياسة الاستخدام
              </h1>
              <p className="font-body text-xs text-ink-soft">
                منصة FastOrder — الحرم الجامعي
              </p>
            </div>
          </div>
          <Logo variant="compact" href="/auth/register" />
        </div>

        {/* Notice Banner */}
        <div className="bg-primary-soft/60 border border-primary/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary-ink shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-display font-bold text-sm text-primary-ink">
              مرحباً بك في FastOrder
            </h2>
            <p className="font-body text-xs text-ink-soft leading-relaxed">
              تهدف هذه الشروط إلى توفير تجربة سريعة وعادلة لجميع الطلاب مع الحفاظ على سير العمل في أكشاك الحرم الجامعي. يُرجى قراءة البنود التالية بعناية؛ فاستخدامك للمنصة يُعد موافقة كاملة عليها.
            </p>
          </div>
        </div>

        {/* Sections Cards */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isStrict = (section as any).isStrict;

            return (
              <div
                key={section.id}
                id={section.id}
                className={
                  isStrict
                    ? 'bg-danger-soft/70 border-2 border-danger/40 rounded-2xl p-5 sm:p-6 shadow-sm text-right space-y-3 scroll-mt-6'
                    : 'bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm hover:border-line/90 transition-all text-right space-y-3 scroll-mt-6'
                }
              >
                <div
                  className={`flex items-center justify-between gap-3 pb-2 border-b ${
                    isStrict ? 'border-danger/30' : 'border-line/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isStrict
                          ? 'bg-danger/20 text-danger'
                          : 'bg-primary-soft text-primary-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3
                      className={`font-display font-bold text-base ${
                        isStrict ? 'text-danger' : 'text-ink'
                      }`}
                    >
                      {section.title}
                    </h3>
                  </div>

                  {isStrict && (
                    <span className="bg-danger text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      حظر فوري ومباشر
                    </span>
                  )}
                </div>

                <ul
                  className={`space-y-2 font-body text-xs sm:text-sm leading-relaxed pr-1 ${
                    isStrict ? 'text-red-950 font-medium' : 'text-ink-soft'
                  }`}
                >
                  {section.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      {isStrict ? (
                        <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      )}
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Support & Contact Card */}
        <div className="bg-surface border border-line rounded-2xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-ink">
              هل لديك استفسار حول الشروط؟
            </h4>
            <p className="font-body text-xs text-ink-soft mt-1 max-w-md mx-auto">
              يمكنك المراجعة  مع مشرفي المنصة في كليتك لمزيد من المعلومات.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/auth/register')}
            >
              العودة إلى إنشاء الحساب
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center font-body text-[11px] text-ink-soft pb-8">
          آخر تحديث: سبتمبر 2026 · جميع الحقوق محفوظة لمنصة FastOrder
        </p>
      </div>
    </div>
  );
}
