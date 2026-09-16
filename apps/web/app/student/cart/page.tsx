'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/formatters';
import { compressImage } from '@/lib/utils/imageCompression';
import { tokenStorage } from '@/lib/api/client';
import {
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Store,
  ShieldAlert,
  AlertTriangle,
  Banknote,
  Smartphone,
  Copy,
  Check,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  MessageSquareQuote,
  CheckCircle2,
  X,
} from 'lucide-react';

const QUICK_NOTES = [
  'بدون مخلل',
  'زيادة شطة',
  'تسوية زيادة',
  'بدون سكر',
  'استلام سريع',
];

export default function CartPage() {
  const router = useRouter();
  const { student, studentStatus } = useAuthStore();
  const { items, kiosk, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const { placeOrder } = useOrderStore();

  const subtotal = getSubtotal();
  const totalAmount = subtotal + 1; // 1 EGP service fee

  // Kiosk Payment Rules
  const acceptsCash = kiosk?.acceptsCash !== false;
  const acceptsOnline = kiosk?.acceptsOnline === true;
  const policy = kiosk?.paymentPolicy || 'both';

  const isCashOnly = policy === 'cash_only' || (acceptsCash && !acceptsOnline);
  const isOnlineOnly = policy === 'online_only' || (acceptsOnline && !acceptsCash);
  const canChoose = !isCashOnly && !isOnlineOnly && acceptsCash && acceptsOnline;

  // Form States
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital_wallet'>('cash');
  const [onlineType, setOnlineType] = useState<'wallet' | 'instapay'>('wallet');
  const [orderNotes, setOrderNotes] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [transferredAmount, setTransferredAmount] = useState(String(totalAmount));
  const [transferImageUrl, setTransferImageUrl] = useState<string | null>(null);

  // UI Feedback States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize payment method defaults with kiosk policy
  useEffect(() => {
    if (isOnlineOnly) {
      setPaymentMethod('digital_wallet');
    } else if (isCashOnly) {
      setPaymentMethod('cash');
    }
  }, [isOnlineOnly, isCashOnly]);

  // Keep transferred amount in sync with order total
  useEffect(() => {
    setTransferredAmount(String(totalAmount));
  }, [totalAmount]);

  // Set default online channel based on what the kiosk configured
  useEffect(() => {
    if (kiosk?.walletNumber && !kiosk?.instapayHandle) {
      setOnlineType('wallet');
    } else if (!kiosk?.walletNumber && kiosk?.instapayHandle) {
      setOnlineType('instapay');
    }
  }, [kiosk?.walletNumber, kiosk?.instapayHandle]);

  // Handle Copy Number
  const handleCopyAccount = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2200);
  };

  // Handle Quick Note Tag click
  const handleAddQuickNote = (tag: string) => {
    if (orderNotes.includes(tag)) return;
    setOrderNotes((prev) => (prev ? `${prev}، ${tag}` : tag));
  };

  // Handle Receipt Upload with Client-Side Compression
  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة صالحة للإيصال (JPG, PNG, WebP)');
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);

      // Client-side compression: Resizes to max 1280px & JPEG 82% quality (< 150KB)
      const compressedFile = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.82 });

      const formData = new FormData();
      formData.append('file', compressedFile);

      const token = tokenStorage.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع إيصال التحويل');
      }

      setTransferImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفع صورة التحويل');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmOrder = async () => {
    if (items.length === 0 || !kiosk) return;
    if (!student) {
      setError('يرجى تسجيل الدخول بحساب طالب أولاً لتأكيد طلبك');
      router.push('/auth/login');
      return;
    }
    if (studentStatus === 'restricted') {
      alert('حسابك مقيد مؤقتاً لعدم استلام أوردر سابق. يرجى مراجعة إدارة الكشك.');
      return;
    }

    // Validation for Online Payment
    if (paymentMethod === 'digital_wallet') {
      if (!senderPhone.trim()) {
        setError('يرجى إدخال رقم الهاتف أو الحساب الذي قمت بالتحويل منه');
        return;
      }
      if (!transferImageUrl) {
        setError('يرجى إرفاق صورة أو لقطة شاشة لإيصال التحويل لتأكيد دفع الأوردر');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const order = await placeOrder({
        studentId: student?.id || '',
        studentName: student?.name || 'طالب',
        studentCollege: student?.college || 'كلية الحاسبات والمعلومات',
        kiosk,
        items,
        paymentMethod,
        orderNotes: orderNotes.trim() || undefined,
        onlinePaymentType: paymentMethod === 'digital_wallet' ? onlineType : undefined,
        transferSenderPhone: paymentMethod === 'digital_wallet' ? senderPhone.trim() : undefined,
        transferAmount: paymentMethod === 'digital_wallet' ? Number(transferredAmount) || totalAmount : undefined,
        transferImageUrl: paymentMethod === 'digital_wallet' ? transferImageUrl || undefined : undefined,
      });

      clearCart();
      setIsSubmitting(false);
      router.push(`/student/orders/${order.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'حدث خطأ أثناء إرسال الطلب');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="سلتك فاضية دلوقتي"
          description="تصفح أكشاك الجامعة واختر المشروبات والسندوتشات اللي تحبها."
          actionLabel="تصفح الأكشاك"
          onAction={() => router.push('/student/kiosks')}
        />
      </div>
    );
  }

  // Active kiosk payment target info
  const activeKioskAccount =
    onlineType === 'wallet'
      ? kiosk?.walletNumber || kiosk?.phone || '01012345678'
      : kiosk?.instapayHandle || 'kiosk@instapay';

  return (
    <div className="max-w-md mx-auto space-y-5 pb-10">
      {/* Screen Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-line/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-canvas transition-colors"
          aria-label="الرجوع"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-display font-bold text-lg text-ink">
            السلة وتأكيد الطلب
          </h3>
          <p className="font-body text-xs text-ink-soft flex items-center gap-1">
            <Store className="w-3 h-3 text-accent" />
            <span>{kiosk?.name || 'الكشك'}</span>
          </p>
        </div>
      </div>

      {/* Account warning if on 1st No-Show warning */}
      {studentStatus === 'warning' && (
        <div className="bg-primary-soft border border-primary/40 rounded-2xl p-3 text-xs font-body text-primary-ink flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>تنبيه:</strong> لديك تحذير مسبق بسبب عدم استلام طلب سابق. نرجو الالتزام باستلام هذا الطلب لتفادي تقييد الحساب.
          </span>
        </div>
      )}

      {/* Account restriction warning if restricted */}
      {studentStatus === 'restricted' && (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 text-xs font-body text-danger flex items-start gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>حساب مقيد:</strong> تم إيقاف إمكانية إرسال طلبات جديدة نظراً لعدم الحضور المسبق.
          </span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm divide-y divide-line/70">
        <h4 className="font-display font-bold text-sm text-ink pb-3">الأصناف المختارة</h4>
        {items.map((cartItem) => {
          const itemTotal = cartItem.menuItem.price * cartItem.quantity;
          const isCombo = cartItem.menuItem.isCombo;
          const hasComboItems = isCombo && cartItem.menuItem.comboItems && cartItem.menuItem.comboItems.length > 0;

          return (
            <div
              key={cartItem.menuItem.id}
              className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-body font-bold text-sm text-ink">
                    {cartItem.menuItem.name}
                  </p>

                  {isCombo && (
                    <span className="text-[10px] font-body font-medium text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line/60">
                      باقة كومبو
                    </span>
                  )}
                </div>

                {hasComboItems && (
                  <div className="bg-canvas/80 border border-line/70 rounded-xl px-2.5 py-1.5 mt-2 mb-2 text-right">
                    <p className="font-body text-xs font-bold text-ink leading-snug">
                      <span className="text-ink-soft text-xs font-semibold ml-1">يشمل:</span>
                      <span className="text-ink font-black">
                        {cartItem.menuItem.comboItems!.map((c) => `${c.quantity}× ${c.name}`).join(' + ')}
                      </span>
                    </p>
                  </div>
                )}

                {/* Mini Stepper */}
                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                    className="w-6 h-6 rounded-full border border-line bg-canvas hover:bg-line/40 flex items-center justify-center text-ink-soft hover:text-ink transition-colors active:scale-95"
                    aria-label="تقليل الكمية"
                  >
                    {cartItem.quantity === 1 ? <Trash2 className="w-3 h-3 text-danger" /> : <Minus className="w-3 h-3" />}
                  </button>

                  <span className="font-mono text-sm font-bold min-w-[16px] text-center font-mono-nums">
                    {cartItem.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                    className="w-6 h-6 rounded-full border border-line bg-canvas hover:bg-line/40 flex items-center justify-center text-ink-soft hover:text-ink transition-colors active:scale-95"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-left flex-shrink-0 pt-0.5">
                <span className="font-mono text-sm font-bold text-ink font-mono-nums block">
                  {formatEGP(itemTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Order Notes Section (ملاحظات الطالب) */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-3 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-line/60">
          <label htmlFor="order-notes" className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
            <MessageSquareQuote className="w-4 h-4 text-primary-ink" />
            <span>إضافة ملاحظات للطلب (اختياري)</span>
          </label>
          <span className="text-[11px] font-body text-ink-soft">للكشك مباشرة</span>
        </div>

        <textarea
          id="order-notes"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={2}
          placeholder="مثال: بدون مخلل، زيادة كاتشب، استلام سريع بين المحاضرات..."
          className="w-full text-xs font-body p-3 rounded-2xl border border-line bg-canvas/60 text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
        />

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-body text-ink-soft ml-1">اقتراحات:</span>
          {QUICK_NOTES.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddQuickNote(tag)}
              className="text-[10px] font-body font-medium bg-canvas hover:bg-primary-soft hover:text-primary-ink border border-line/80 px-2 py-1 rounded-lg transition-colors select-none"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Payment Method Selector (اختيار وسيلة الدفع) */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
        <div className="pb-2 border-b border-line/60 flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-accent" />
            <span>وسيلة الدفع</span>
          </h4>
          <span className="text-[11px] font-body text-ink-soft">
            {isOnlineOnly ? 'مطلوب تحويل أونلاين' : isCashOnly ? 'كاش فقط عند الاستلام' : 'اختر وسيلتك المفضلة'}
          </span>
        </div>

        {/* Dynamic Selector based on Kiosk Setting */}
        {canChoose ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 select-none ${
                paymentMethod === 'cash'
                  ? 'bg-primary-soft/40 border-primary shadow-xs ring-1 ring-primary/30'
                  : 'bg-canvas border-line hover:border-ink-soft/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-primary-ink' : 'text-ink-soft'}`} />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary text-white' : 'border-line'
                  }`}
                >
                  {paymentMethod === 'cash' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <p className="font-body font-bold text-xs text-ink">كاش عند الاستلام</p>
                <p className="font-body text-[10px] text-ink-soft mt-0.5">الدفع في الكشك مباشرة</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('digital_wallet')}
              className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 select-none ${
                paymentMethod === 'digital_wallet'
                  ? 'bg-accent-soft/50 border-accent shadow-xs ring-1 ring-accent/30'
                  : 'bg-canvas border-line hover:border-ink-soft/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <Smartphone className={`w-5 h-5 ${paymentMethod === 'digital_wallet' ? 'text-accent' : 'text-ink-soft'}`} />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'digital_wallet' ? 'border-accent bg-accent text-white' : 'border-line'
                  }`}
                >
                  {paymentMethod === 'digital_wallet' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
              <div>
                <p className="font-body font-bold text-xs text-ink">دفع إلكتروني</p>
                <p className="font-body text-[10px] text-ink-soft mt-0.5">محفظة / انستا باي</p>
              </div>
            </button>
          </div>
        ) : isOnlineOnly ? (
          <div className="bg-accent-soft/40 border border-accent/30 rounded-2xl p-3 text-xs font-body text-accent flex items-center gap-2">
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>هذا الكشك يقبل الدفع الإلكتروني المسبق فقط (محفظة أو انستا باي).</span>
          </div>
        ) : (
          <div className="bg-primary-soft/40 border border-primary/30 rounded-2xl p-3 text-xs font-body text-primary-ink flex items-center gap-2">
            <Banknote className="w-4 h-4 flex-shrink-0" />
            <span>الدفع كاش عند استلام طلبك من الكشك مباشرة.</span>
          </div>
        )}

        {/* 3. Online Payment Details & Proof Upload */}
        {paymentMethod === 'digital_wallet' && (
          <div className="space-y-4 pt-2 border-t border-line/60 animate-in fade-in duration-200">
            {/* Kiosk Transfer Target Credentials Card */}
            <div className="bg-canvas border border-line rounded-2xl p-3.5 space-y-3">
              {/* Type Switcher if kiosk supports both Wallet and Instapay */}
              {kiosk?.walletNumber && kiosk?.instapayHandle && (
                <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-line text-xs font-body">
                  <button
                    type="button"
                    onClick={() => setOnlineType('wallet')}
                    className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${
                      onlineType === 'wallet' ? 'bg-accent text-white shadow-xs' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    محفظة إلكترونية
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineType('instapay')}
                    className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${
                      onlineType === 'instapay' ? 'bg-accent text-white shadow-xs' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    انستا باي (InstaPay)
                  </button>
                </div>
              )}

              {/* Number and Copy Row */}
              <div>
                <p className="text-[11px] font-body text-ink-soft">
                  {onlineType === 'wallet' ? 'رقم محفظة الكشك (فودافون كاش / اتصالات / أورانج / وي):' : 'معرف / حساب انستا باي للكشك:'}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1 bg-surface p-2.5 rounded-xl border border-line">
                  <span className="font-mono text-sm font-black text-ink font-mono-nums tracking-wide dir-ltr">
                    {activeKioskAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(activeKioskAccount)}
                    className="flex items-center gap-1 text-[11px] font-body font-bold text-accent hover:bg-accent-soft px-2.5 py-1 rounded-lg border border-accent/30 transition-colors"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-3 h-3 text-accent" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Amount to transfer alert */}
              <div className="flex items-center justify-between text-xs font-body bg-accent-soft/30 px-3 py-2 rounded-xl text-accent font-bold">
                <span>المبلغ المطلوب تحويله للكشك:</span>
                <span className="font-mono text-sm font-black font-mono-nums">{formatEGP(totalAmount)}</span>
              </div>
            </div>

            {/* Sender Details Form */}
            <div className="space-y-3">
              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-body font-bold text-ink mb-1">
                  الرقم المحول منه <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="مثال: 010xxxxxxxx أو اسم حساب انستا باي"
                  className="w-full text-xs font-body p-2.5 rounded-xl border border-line bg-canvas text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>

              {/* Transferred Amount */}
              <div>
                <label className="block text-xs font-body font-bold text-ink mb-1">
                  المبلغ المحول (ج.م) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  value={transferredAmount}
                  onChange={(e) => setTransferredAmount(e.target.value)}
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-line bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent font-mono-nums"
                />
              </div>

              {/* Receipt Upload Dropzone */}
              <div>
                <label className="block text-xs font-body font-bold text-ink mb-1">
                  رفع صورة أو سكرين شوت التحويل <span className="text-danger">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadReceipt}
                  className="hidden"
                />

                {transferImageUrl ? (
                  <div className="relative border border-accent/40 bg-accent-soft/20 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden relative border border-line flex-shrink-0 bg-surface">
                        <Image
                          src={transferImageUrl}
                          alt="إيصال التحويل"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-body font-bold text-accent flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم إرفاق الإيصال بنجاح</span>
                        </p>
                        <p className="text-[10px] font-body text-ink-soft truncate mt-0.5">
                          جاهز للمراجعة من قبل الكاشير
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTransferImageUrl(null)}
                      className="w-8 h-8 rounded-full bg-danger-soft text-danger hover:bg-danger hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-line hover:border-accent/60 bg-canvas hover:bg-accent-soft/20 rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 select-none"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-6 h-6 text-accent animate-spin" />
                        <span className="text-xs font-body font-bold text-accent">جاري ضغط ورفع الصورة...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-ink-soft hover:text-accent" />
                        <span className="text-xs font-body font-bold text-ink">اضغط لرفع لقطة شاشة / صورة الإيصال</span>
                        <span className="text-[10px] font-body text-ink-soft">يتم ضغط الصورة تلقائياً لسرعة الرفع</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Box */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-2.5">
        <div className="flex justify-between text-xs font-body text-ink-soft font-medium">
          <span>إجمالي الأصناف</span>
          <span className="font-mono font-semibold font-mono-nums">{formatEGP(subtotal)}</span>
        </div>

        <div className="flex justify-between text-xs font-body text-ink-soft font-medium">
          <span>رسوم الخدمة</span>
          <span className="font-mono font-semibold font-mono-nums">{formatEGP(1)}</span>
        </div>

        <div className="flex justify-between font-body text-sm font-bold text-ink pt-2.5 border-t border-line/60">
          <span>{paymentMethod === 'digital_wallet' ? 'المطلوب تحويله الآن' : 'المطلوب عند الاستلام'}</span>
          <span className="font-mono text-base text-primary-ink font-mono-nums font-black">{formatEGP(totalAmount)}</span>
        </div>

        <p className="text-[11px] font-body text-ink-soft text-center pt-2 leading-relaxed">
          {paymentMethod === 'digital_wallet'
            ? 'سيرى الكاشير إيصال التحويل ورقم المعاملة فوراً لتأكيد طلبك وتجهيزه.'
            : 'تدفع كاش وقت ما تستلم الأوردر من الكشك مباشرة.'}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-danger-soft border border-danger/30 text-danger rounded-xl p-3.5 text-xs font-body font-bold animate-in fade-in duration-200 flex flex-col gap-2">
          <span>{error}</span>
          {error.includes('طالب') && (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center bg-danger text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-danger/90 transition-colors w-fit"
            >
              تسجيل الدخول بحساب طالب الآن
            </Link>
          )}
        </div>
      )}

      {/* Confirm Order Button */}
      <Button
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={studentStatus === 'restricted' || isUploadingImage}
        onClick={handleConfirmOrder}
        className="w-full shadow-warm"
      >
        تأكيد الأوردر ({formatEGP(totalAmount)})
      </Button>
    </div>
  );
}
