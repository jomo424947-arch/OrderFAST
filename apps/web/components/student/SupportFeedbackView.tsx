'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { supportService } from '@/lib/services/supportService';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatArabicTime } from '@/lib/formatters';
import type { SupportTicket, SupportCategory, University } from '@orderfast/types';
import {
  MessageSquare,
  ShoppingBag,
  Store,
  CreditCard,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Clock,
  Send,
  Phone,
  User,
  ShieldCheck,
  ChevronLeft,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CategoryOption {
  id: SupportCategory;
  title: string;
  description: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'order_issue',
    title: 'مشكلة في طلب',
    description: 'تأخير في التحضير، صنف ناقص، أو جودة الطلب',
    icon: ShoppingBag,
  },
  {
    id: 'kiosk_issue',
    title: 'شكوى بخصوص كشك',
    description: 'تعامل الكاشير، عدم توفر الأصناف، أو مواعيد العمل',
    icon: Store,
  },
  {
    id: 'payment_issue',
    title: 'مشكلة في الدفع',
    description: 'فودافون كاش، إنستاباي، أو مشاكل الدفع النقدي',
    icon: CreditCard,
  },
  {
    id: 'app_bug',
    title: 'عطل فني في التطبيق',
    description: 'خطأ تقني، مشكلة في الحساب، أو أزرار لا تستجيب',
    icon: AlertCircle,
  },
  {
    id: 'suggestion',
    title: 'اقتراح لتطوير المنصة',
    description: 'فكرة ميزة جديدة أو تحسين يسهل تجربتك',
    icon: Lightbulb,
  },
  {
    id: 'other',
    title: 'استفسار أو ملاحظة عامة',
    description: 'أي موضوع أو استفسار آخر ترغب في طرحه',
    icon: HelpCircle,
  },
];

export const SupportFeedbackView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const { student, isAuthenticated } = useAuthStore();
  const { orders, fetchStudentOrders } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form State
  const [category, setCategory] = useState<SupportCategory>('order_issue');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Sender details (auto-populated if logged in)
  const [senderName, setSenderName] = useState(student?.name || '');
  const [senderPhone, setSenderPhone] = useState(student?.phone || '');
  const [senderEmail, setSenderEmail] = useState(student?.email || '');
  const [university, setUniversity] = useState<University>((student?.university as University) || 'sphinx');
  const [college, setCollege] = useState(student?.college || '');

  // Order selection
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  // My Past Tickets State
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    if (student) {
      if (!senderName) setSenderName(student.name || '');
      if (!senderPhone && student.phone) setSenderPhone(student.phone);
      if (!senderEmail && student.email) setSenderEmail(student.email);
      if (student.university) setUniversity(student.university as University);
      if (student.college && !college) setCollege(student.college);
      fetchStudentOrders(student.id);
    }
  }, [student, fetchStudentOrders]);

  const loadMyTickets = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingTickets(true);
      const data = await supportService.getMyTickets();
      setMyTickets(data);
    } catch {
      // Ignore background errors
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      loadMyTickets();
    }
  }, [activeTab, isAuthenticated]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      if (!subject) {
        setSubject(`مشكلة في الطلب رقم #${order.orderNumber} - ${order.kioskName}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!senderName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل');
      return;
    }

    if (!senderPhone.trim() || senderPhone.trim().length < 10) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح للتواصل');
      return;
    }

    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMessage('يرجى إدخال عنوان مختصر للموضوع');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('يرجى كتابة تفاصيل المشكلة أو الاقتراح بوضوح (10 أحرف على الأقل)');
      return;
    }

    const selectedOrder = orders.find((o) => o.id === selectedOrderId);

    try {
      setIsSubmitting(true);
      const ticket = await supportService.submitTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        imageUrl: imageUrl || undefined,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        senderEmail: senderEmail.trim() || undefined,
        university,
        college: college.trim() || undefined,
        orderId: selectedOrderId || undefined,
        orderNumber: selectedOrder?.orderNumber || undefined,
        kioskId: selectedOrder?.kioskId || undefined,
        kioskName: selectedOrder?.kioskName || undefined,
      });

      setSubmittedTicket(ticket);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setSubject('');
    setMessage('');
    setImageUrl(null);
    setSelectedOrderId('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-body font-bold text-primary-ink">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>مركز الدعم والمقترحات</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
              الشكاوى والمقترحات
            </h1>
            <p className="font-body text-xs sm:text-sm text-ink-soft leading-relaxed max-w-xl">
              صوتك يهمنا. شاركنا أي ملاحظة، شكوى بخصوص أوردر أو كشك، أو فكرة تطوير وسيقوم فريق الدعم بمتابعتها فوراً.
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2 bg-canvas p-1.5 rounded-2xl border border-line self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-body font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-primary text-primary-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                إرسال تذكرة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-body font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                تذاكري السابقة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUCCESS STATE */}
      {submittedTicket ? (
        <Card className="p-6 sm:p-10 border border-primary/30 shadow-warm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-soft text-accent mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-black text-xl sm:text-2xl text-ink">
              تم استلام تذكرتك بنجاح
            </h3>
            <p className="font-body text-sm text-ink-soft max-w-md mx-auto">
              شكراً لتواصلك معنا. يقوم فريق الإدارة والدعم الفني بمراجعة تذكرتك حالياً، وسنتواصل معك عبر الهاتف المسجل.
            </p>
          </div>

          {/* Ticket Reference Code */}
          <div className="inline-block bg-canvas border border-line px-5 py-3 rounded-2xl">
            <p className="font-body text-xs text-ink-soft mb-1">رقم التذكرة المرجعي</p>
            <p className="font-mono font-bold text-xl text-primary tracking-wide">
              {submittedTicket.ticketNumber}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 ml-1.5" />
              <span>إرسال تذكرة أخرى</span>
            </Button>

            {isAuthenticated ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setSubmittedTicket(null);
                  setActiveTab('history');
                }}
                className="w-full sm:w-auto"
              >
                <span>متابعة التذاكر السابقة</span>
                <ChevronLeft className="w-4 h-4 mr-1.5" />
              </Button>
            ) : (
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  <span>العودة للرئيسية</span>
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : activeTab === 'history' && isAuthenticated ? (
        /* MY PREVIOUS TICKETS TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-ink">
              سجل التذاكر المرسلة
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMyTickets}
              isLoading={isLoadingTickets}
            >
              تحديث
            </Button>
          </div>

          {isLoadingTickets ? (
            <div className="p-12 text-center text-ink-soft font-body text-sm">
              جاري تحميل تذاكرك...
            </div>
          ) : myTickets.length > 0 ? (
            <div className="space-y-3">
              {myTickets.map((t) => (
                <Card key={t.id} className="p-4 sm:p-5 border border-line hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-ink bg-canvas px-2.5 py-1 rounded-lg border border-line">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-xs font-body font-bold px-2.5 py-0.5 rounded-full ${
                            t.status === 'resolved'
                              ? 'bg-accent-soft text-accent'
                              : t.status === 'in_progress'
                              ? 'bg-primary-soft text-primary-ink'
                              : 'bg-canvas text-ink-soft border border-line'
                          }`}
                        >
                          {t.status === 'resolved'
                            ? 'تم الحل'
                            : t.status === 'in_progress'
                            ? 'قيد المتابعة'
                            : 'قيد المراجعة'}
                        </span>
                        {t.orderNumber && (
                          <span className="text-[11px] font-mono text-ink-soft">
                            طلب #{t.orderNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="font-body font-bold text-sm sm:text-base text-ink">
                        {t.subject}
                      </h4>
                    </div>

                    <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
                      {formatArabicTime(t.createdAt)}
                    </span>
                  </div>

                  <p className="font-body text-xs text-ink-soft leading-relaxed line-clamp-3 mb-3">
                    {t.message}
                  </p>

                  {/* Admin Reply Box if present */}
                  {t.adminReply && (
                    <div className="bg-canvas border border-primary/20 rounded-2xl p-3.5 space-y-1 mt-2">
                      <p className="font-body font-bold text-xs text-primary flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>رد فريق الإدارة:</span>
                      </p>
                      <p className="font-body text-xs text-ink leading-relaxed">
                        {t.adminReply}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-canvas border border-line flex items-center justify-center mx-auto text-ink-soft">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-body font-bold text-sm text-ink">
                لا توجد تذاكر سابقة
              </p>
              <p className="font-body text-xs text-ink-soft">
                لم تقم بإرسال أي شكاوى أو مقترحات حتى الآن.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('create')}
              >
                إرسال تذكرة جديدة
              </Button>
            </Card>
          )}
        </div>
      ) : (
        /* CREATE TICKET FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SENDER IDENTITY CARD */}
          <Card className="p-5 border border-line space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <ShieldCheck className="w-4 h-4 text-accent" />
                ) : (
                  <User className="w-4 h-4 text-ink-soft" />
                )}
                <h3 className="font-body font-bold text-sm text-ink">
                  {isAuthenticated ? 'بيانات حساب الطالب المعتمد' : 'بيانات مقدم التذكرة'}
                </h3>
              </div>
              <span
                className={`text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full ${
                  isAuthenticated
                    ? 'bg-accent-soft text-accent'
                    : 'bg-canvas text-ink-soft border border-line'
                }`}
              >
                {isAuthenticated ? 'طالب مسجل' : 'زائر'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block font-body text-xs font-semibold text-ink mb-1.5">
                  الاسم بالكامل <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="اكتب اسمك ثلاثياً"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-body text-xs font-semibold text-ink mb-1.5">
                  رقم الهاتف للتواصل <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-canvas border border-line font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 text-right"
                  />
                  <Phone className="w-4 h-4 text-ink-soft absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* University */}
              <div>
                <label className="block font-body text-xs font-semibold text-ink mb-1.5">
                  الجامعة
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value as University)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="sphinx">جامعة سفنكس</option>
                  <option value="assiut_ahleya">جامعة أسيوط الأهلية</option>
                </select>
              </div>

              {/* College */}
              <div>
                <label className="block font-body text-xs font-semibold text-ink mb-1.5">
                  الكلية (اختياري)
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="مثال: حاسبات ومعلومات، طب، صيدلة..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </Card>

          {/* CATEGORY SELECTION */}
          <div className="space-y-3">
            <label className="block font-body text-sm font-bold text-ink">
              نوع المشكلة أو الرسالة <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary-soft/30 border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-surface border-line hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary text-primary-ink'
                            : 'bg-canvas text-ink-soft'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-line bg-canvas'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-body font-bold text-sm text-ink mb-0.5">
                        {cat.title}
                      </h4>
                      <p className="font-body text-[11px] text-ink-soft leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LINK RECENT ORDER (IF ORDER ISSUE AND LOGGED IN) */}
          {isAuthenticated && orders.length > 0 && (
            <Card className="p-4 border border-line bg-canvas/60 space-y-2">
              <label className="block font-body text-xs font-bold text-ink">
                هل المشكلة متعلقة بطلب معين؟ (اختياري)
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">لا، المشكلة غير مرتبطة بطلب محدد</option>
                {orders.slice(0, 10).map((o) => (
                  <option key={o.id} value={o.id}>
                    طلب #{o.orderNumber} - {o.kioskName} ({o.status})
                  </option>
                ))}
              </select>
            </Card>
          )}

          {/* SUBJECT & MESSAGE */}
          <Card className="p-5 border border-line space-y-4">
            <div>
              <label className="block font-body text-xs font-semibold text-ink mb-1.5">
                عنوان المشكلة أو الاقتراح <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="اكتب عنواناً مختصراً وواضحاً..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-xs font-semibold text-ink">
                  تفاصيل المشكلة أو الرسالة <span className="text-danger">*</span>
                </label>
                <span className="font-mono text-[10px] text-ink-soft">
                  {message.length} / 3000
                </span>
              </div>
              <textarea
                required
                rows={5}
                maxLength={3000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل، ما الذي حدث معك بالضبط وكيف يمكننا مساعدتك؟"
                className="w-full p-3.5 rounded-xl bg-canvas border border-line font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y leading-relaxed"
              />
            </div>

            {/* SCREENSHOT / IMAGE ATTACHMENT */}
            <div className="space-y-2 pt-2 border-t border-line">
              <label className="block font-body text-xs font-semibold text-ink">
                إرفاق صورة أو سكرين شوت (اختياري)
              </label>
              <p className="font-body text-[11px] text-ink-soft mb-2">
                يمكنك إرفاق صورة توضح المشكلة أو إيصال تحويل أو لقطة شاشة للخطأ التقني.
              </p>
              <ImageUploadDropzone
                value={imageUrl || undefined}
                onChange={(url) => setImageUrl(url)}
                onClear={() => setImageUrl(null)}
              />
            </div>
          </Card>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-danger-soft border border-danger/20 text-danger font-body text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full shadow-warm"
            >
              <Send className="w-4 h-4 ml-2" />
              <span>إرسال التذكرة الآن</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
