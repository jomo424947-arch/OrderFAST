'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Trash2,
  ExternalLink,
  CheckCircle2,
  FileText,
  HelpCircle,
  Globe,
  UserCheck,
  Server,
  Share2,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

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

  return (
    <div
      className="min-h-screen bg-canvas py-8 px-4 sm:px-6"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex items-center justify-between gap-4 bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-canvas border border-line flex items-center justify-center text-ink hover:bg-line/40 transition-colors"
              aria-label={lang === 'ar' ? 'الرجوع' : 'Go back'}
            >
              <ArrowRight
                className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`}
              />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg sm:text-xl text-ink">
                {lang === 'ar'
                  ? 'سياسة الخصوصية وحماية البيانات'
                  : 'Privacy & Data Protection Policy'}
              </h1>
              <p className="font-body text-xs text-ink-soft">
                {lang === 'ar'
                  ? 'منصة FastOrder — الحرم الجامعي (fast0rder.online)'
                  : 'FastOrder Campus Platform (fast0rder.online)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Button */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-canvas hover:bg-surface-elevated text-xs font-semibold text-ink transition-colors"
              title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3.5 h-3.5 text-primary-ink" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>
            <Logo variant="compact" href="/auth/register" />
          </div>
        </div>

        {/* Google OAuth & Trust Highlight Banner */}
        <div className="bg-primary-soft/70 border border-primary/25 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary-ink shrink-0" />
            <h2 className="font-display font-bold text-sm sm:text-base text-primary-ink">
              {lang === 'ar'
                ? 'التزام FastOrder بالخصوصية ومعايير Google المعتمدة'
                : 'FastOrder Commitment to Privacy & Google API Standards'}
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
            {lang === 'ar'
              ? 'تلتزم منصة FastOrder بحماية بيانات الطلاب والعاملين في الحرم الجامعي بأعلى درجات الأمان والشفافية. يوضح هذا المستند البيانات التي نجمعها، وكيفية استخدامها لحجز واستلام الطلبات فقط دون أي استغلال إعلاني أو تجاري خارجي.'
              : 'FastOrder is dedicated to safeguarding student and campus community privacy with top-tier security and complete transparency. This policy outlines what data we collect, how it is handled for campus food pre-ordering, and our strict non-monetization policy.'}
          </p>
        </div>

        {lang === 'ar' ? (
          /* ================= ARABIC CONTENT ================= */
          <div className="space-y-4">
            {/* 1. التعريف بالخدمة */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  1. نظرة عامة والتعريف بالمنصة
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  منصة <strong>FastOrder</strong> (عبر النطاق{' '}
                  <code className="text-primary-ink font-semibold">fast0rder.online</code>)
                  هي خدمة تقنية مخصصة لتنظيم طلبات الوجبات والمشروبات المسبقة داخل الحرم
                  الجامعي، بهدف تقليل فترات الانتظار ومنع التزاحم أمام أكشاك وكافيهات الكليات.
                </p>
                <p>
                  تسري هذه السياسة على كافة مستخدمي المنصة (الطلاب، أعضاء هيئة التدريس، ومقدمي
                  الخدمة داخل الأكشاك).
                </p>
              </div>
            </div>

            {/* 2. البيانات التي نجمعها */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  2. ما هي البيانات التي نقوم بجمعها؟
                </h3>
              </div>
              <ul className="space-y-2.5 font-body text-xs sm:text-sm text-ink-soft leading-relaxed pr-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">بيانات تسجيل الدخول عبر Google (Google OAuth):</strong>{' '}
                    عند اختيارك تسجيل الدخول السريع عبر Google، نقوم بطلب الصلاحيات الأساسية فقط (
                    <code>email</code>, <code>profile</code>, <code>openid</code>) ونحصل على:
                    الاسم الكامل، عنوان البريد الإلكتروني، والصورة الشخصية التلقائية.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">البيانات الأكاديمية والجامعية:</strong>{' '}
                    اسم الكلية التابع لها داخل الجامعة (لتخصيص الأكشاك الأقرب لك ومواعيد الاستلام).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">معلومات الاتصال المباشرة:</strong>{' '}
                    رقم الهاتف المحمول (يُستخدم فقط في التحقق وإرسال إشعارات جاهزية الأوردر للاستلام).
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">سجلات الطلبات وحالتها:</strong>{' '}
                    تفاصيل الأطعمة والمشروبات المطلوبة، تاريخ ووقت الطلب، والكشك الموجه له الطلب.
                  </div>
                </li>
              </ul>
            </div>

            {/* 3. كيف نستخدم البيانات */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  3. أوجه استخدام البيانات
                </h3>
              </div>
              <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                نستخدم البيانات المجمعة حصرياً للأغراض التشغيلية التالية:
              </p>
              <ul className="space-y-2 font-body text-xs sm:text-sm text-ink-soft leading-relaxed pr-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>التحقق من هوية الطالب وإنشاء وتأمين حسابه الأكاديمي.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    إرسال إشعارات حية حول حالة تحضير الطلب (قيد التحضير / جاهز للاستلام / رقم الاستلام).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    عرض اسم الطالب ورقم طلبه على شاشة الكشك المسؤول لتسليم الطلب للشخص الصحيح.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    حساب مؤشرات الطوابير وأزمنة الانتظار التقريبية لتسهيل حركة الطلاب بين المحاضرات.
                  </span>
                </li>
              </ul>
            </div>

            {/* 4. إقرار Google API Services و الاستخدام المحدود (Limited Use) */}
            <div className="bg-surface-elevated border-2 border-primary/40 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  4. سياسة الاستخدام المحدود لبيانات Google API (Limited Use Policy)
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p className="font-medium text-ink">
                  تلتزم منصة FastOrder التزاماً تاماً بـ{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-ink underline hover:opacity-80 inline-flex items-center gap-1"
                  >
                    سياسة بيانات مستخدم خدمات Google API
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  ، بما في ذلك متطلبات الاستخدام المحدود (Limited Use Requirements):
                </p>
                <ul className="space-y-1.5 list-disc list-inside pr-2 text-ink">
                  <li>
                    <strong>لا يتم بيع البيانات نهائياً:</strong> لا نقوم مطلقاً ببيع، تأجير، أو
                    المتاجرة ببيانات المستخدمين أو حسابات Google الخاصة بهم مع أي أطراف ثالثة أو
                    شبكات إعلانية.
                  </li>
                  <li>
                    <strong>لا تُستخدم للإعلانات:</strong> لا تُستخدم بيانات Google OAuth إطلاقاً في
                    توجيه الإعلانات، أو بناء ملفات تعريفية إعلانية، أو إعادة الاستهداف.
                  </li>
                  <li>
                    <strong>لا يطّلع عليها موظفون إلا للضرورة التقنية:</strong> لا يُسمح للبشر بقراءة
                    بيانات Google للمستخدم إلا في حالات محدودة جداً بموافقتك المباشرة لحل مشكلة أمنية
                    أو امتثالاً للقوانين المعمول بها.
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. مشاركة البيانات مع الأطراف الأخرى */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  5. مشاركة البيانات والإفصاح عنها
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  نحن لا نشارك بياناتك إلا في الحدود الدنيا اللازمة لإتمام خدمتك الجامعية:
                </p>
                <ul className="space-y-1.5 list-disc list-inside pr-2">
                  <li>
                    <strong>كشك الكلية المخصص:</strong> يظهر له فقط اسم الطالب والأصناف المطلوبة
                    ورقم الإيصال لتحضير الأوردر وتسليمه.
                  </li>
                  <li>
                    <strong>مزودو البنية التحتية السحابية الموثوقون:</strong> نعتمد على خدمات Supabase
                    و Google Cloud المؤمنة والمشفرة لتخزين وإدارة قواعد البيانات بأعلى معايير الحماية
                    الدولية.
                  </li>
                </ul>
              </div>
            </div>

            {/* 6. حفظ البيانات وأمانها */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  6. أمان البيانات وتشفيرها
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  نطبق إجراءات أمنية صارمة تشمل:
                </p>
                <ul className="space-y-1.5 list-disc list-inside pr-2">
                  <li>
                    تشفير كامل لجميع الاتصالات عبر بروتوكول HTTPS / TLS 1.3 المعتمد دولياً.
                  </li>
                  <li>
                    تخزين كلمات المرور والمفاتيح الحساسة عبر خوارزميات التشفير المعقدة (Hashing).
                  </li>
                  <li>
                    تطبيق قواعد أمان مستوى الصفوف (Row Level Security - RLS) في قاعدة البيانات لمنع
                    أي وصول غير مصرح به بين المستخدمين.
                  </li>
                </ul>
              </div>
            </div>

            {/* 7. حقوق المستخدم وحذف البيانات (Data Deletion) */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-danger-soft text-danger flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  7. حقوقك في تعديل وحذف بياناتك (حق النسيان)
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  لك الحق الكامل في التحكم في بياناتك الشخصية في أي وقت:
                </p>
                <ul className="space-y-2 pr-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <span>
                      <strong>طلب حذف الحساب والبيانات:</strong> يمكنك في أي وقت طلب حذف حسابك
                      وكافة البيانات المرتبطة به بالتواصل مع إدارة المنصة أو مشرف كشك كليتك بالحرم
                      الجامعي، وسيتم حذف كافة بياناتك وسجلاتك نهائياً.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <span>
                      <strong>إلغاء صلاحية الوصول لحساب Google:</strong> يمكنك إلغاء ربط التطبيق
                      بحساب Google الخاص بك في أي لحظة عبر زيارة صفحة إعدادات أمان حساب Google:{' '}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-ink underline hover:opacity-80 inline-flex items-center gap-1"
                      >
                        إدارة أذونات حساب Google
                        <ExternalLink className="w-3 h-3" />
                      </a>.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* ================= ENGLISH CONTENT ================= */
          <div className="space-y-4">
            {/* 1. Overview */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  1. Overview & Service Scope
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  <strong>FastOrder</strong> (operating via{' '}
                  <code className="text-primary-ink font-semibold">fast0rder.online</code>)
                  is a smart campus food and beverage pre-ordering and queue management system. It is
                  tailored exclusively for university students, faculty, and authorized on-campus
                  cafeteria/kiosk operators.
                </p>
                <p>
                  This Privacy Policy explains the collection, usage, and protection of information
                  when using our services or authenticating through Google OAuth.
                </p>
              </div>
            </div>

            {/* 2. Information Collected */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  2. Information We Collect
                </h3>
              </div>
              <ul className="space-y-2.5 font-body text-xs sm:text-sm text-ink-soft leading-relaxed pl-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">Google Account Information (OAuth):</strong> When
                    you choose &quot;Sign in with Google&quot;, we request only non-sensitive standard scopes (
                    <code>email</code>, <code>profile</code>, <code>openid</code>). We receive your
                    verified email address, full display name, and avatar picture URL.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">Campus Profile & Faculty:</strong> The university
                    faculty/college you select to help locate nearest kiosks and optimize pickup
                    schedules.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">Contact Details:</strong> Student phone number used
                    for urgent pickup alerts and identity verification.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">Order Records:</strong> Items ordered, order
                    status, pickup receipts, and timestamp details.
                  </div>
                </li>
              </ul>
            </div>

            {/* 3. Use of Information */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  3. How We Use Your Information
                </h3>
              </div>
              <ul className="space-y-2 font-body text-xs sm:text-sm text-ink-soft leading-relaxed pl-1">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>Securely authenticate student identity and maintain session states.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    Provide live order tracking notifications (Pending, Preparing, Ready for
                    Pickup).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    Display the student&apos;s name on the kiosk order screen to ensure accurate meal
                    handover.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary-ink shrink-0 mt-0.5" />
                  <span>
                    Calculate intelligent queue estimations to save student break time between
                    classes.
                  </span>
                </li>
              </ul>
            </div>

            {/* 4. Google Limited Use Disclosure */}
            <div className="bg-surface-elevated border-2 border-primary/40 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-primary/20 border-b">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  4. Google API Services User Data Policy Compliance (Limited Use)
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p className="font-medium text-ink">
                  FastOrder&apos;s use and transfer to any other app of information received from Google APIs
                  will adhere to the{' '}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-ink underline hover:opacity-80 inline-flex items-center gap-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  , including the Limited Use requirements.
                </p>
                <ul className="space-y-1.5 list-disc list-inside pl-2 text-ink">
                  <li>
                    <strong>No Data Selling:</strong> We never sell, rent, or monetize Google user
                    data to any third parties, brokers, or marketing networks.
                  </li>
                  <li>
                    <strong>No Advertising:</strong> Google user data is never used to serve
                    advertisements, build advertising profiles, or conduct retargeting campaigns.
                  </li>
                  <li>
                    <strong>No Human Readability:</strong> Humans are strictly barred from viewing
                    Google user data unless you provide explicit consent to resolve technical
                    support issues or to meet legal obligations.
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. Data Sharing */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  5. Third-Party Data Sharing & Disclosure
                </h3>
              </div>
              <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                Data is shared strictly on a need-to-know basis to fulfill your order:
              </p>
              <ul className="space-y-1.5 list-disc list-inside pl-2 text-ink-soft text-xs sm:text-sm">
                <li>
                  <strong>Designated Campus Kiosk:</strong> Receives customer name, order number, and
                  selected items exclusively for food preparation.
                </li>
                <li>
                  <strong>Infrastructure Partners:</strong> Enterprise-grade database and
                  authentication providers (Supabase & Google Cloud) complying with SOC-2 and ISO
                  27001 data security frameworks.
                </li>
              </ul>
            </div>

            {/* 6. Security & Storage */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  6. Data Security, Storage & Retention
                </h3>
              </div>
              <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed">
                All data in transit is encrypted using industry-standard TLS 1.3 / HTTPS protocols.
                Data at rest is protected with PostgreSQL Row-Level Security (RLS) policies ensuring
                isolated user data boundaries. Data is retained only as long as you maintain an active
                account on campus.
              </p>
            </div>

            {/* 7. Rights & Deletion */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-line/50">
                <div className="w-8 h-8 rounded-xl bg-danger-soft text-danger flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  7. User Rights & Data Deletion (Right to be Forgotten)
                </h3>
              </div>
              <div className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed space-y-2">
                <p>You have full ownership and rights over your personal data:</p>
                <ul className="space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <span>
                      <strong>Account & Data Deletion Request:</strong> You may request complete
                      removal of your account and personal history at any time by contacting your
                      campus administration or faculty kiosk coordinator. All records will be
                      permanently erased.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <span>
                      <strong>Revoking Google Access:</strong> You can revoke FastOrder&apos;s access to
                      your Google account at any moment through your{' '}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-ink underline hover:opacity-80 inline-flex items-center gap-1"
                      >
                        Google Security Permissions Settings
                        <ExternalLink className="w-3 h-3" />
                      </a>.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Support & Contact Card */}
        <div className="bg-surface border border-line rounded-2xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary-soft text-primary-ink flex items-center justify-center mx-auto">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm sm:text-base text-ink">
              {lang === 'ar'
                ? 'الدعم الفني واستفسارات الخصوصية'
                : 'Privacy & Campus Support'}
            </h4>
            <p className="font-body text-xs text-ink-soft mt-1 max-w-md mx-auto">
              {lang === 'ar'
                ? 'لأي استفسارات حول الخصوصية أو لطلب حذف الحساب، يمكنك التواصل مباشرة مع إدارة المنصة أو مشرف الكشك في كليتك بالحرم الجامعي.'
                : 'For any privacy inquiries or account deletion requests, please reach out to your faculty kiosk administrator or campus platform support.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/auth/register')}
            >
              {lang === 'ar' ? 'العودة إلى إنشاء الحساب' : 'Back to Registration'}
            </Button>
            <Link
              href="/terms"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-soft hover:text-ink hover:bg-line/40 transition-colors border border-line"
            >
              {lang === 'ar' ? 'عرض الشروط والأحكام' : 'Terms of Service'}
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center font-body text-[11px] text-ink-soft pb-8">
          {lang === 'ar'
            ? 'آخر تحديث: سبتمبر 2026 · منصة FastOrder (fast0rder.online) · جميع الحقوق محفوظة'
            : 'Last updated: September 2026 · FastOrder Platform (fast0rder.online) · All rights reserved'}
        </p>
      </div>
    </div>
  );
}
