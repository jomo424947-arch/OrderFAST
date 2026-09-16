'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKioskStore } from '@/stores/useKioskStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import {
  Save,
  Clock,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
  LogOut,
  Archive,
  UtensilsCrossed,
  Bell,
  ChevronLeft,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  Info,
} from 'lucide-react';

export default function CashierSettingsPage() {
  const router = useRouter();
  const { cashier, logout } = useAuthStore();
  const {
    activeKioskId,
    kiosks,
    fetchKiosks,
    updateKioskSettings,
    toggleKioskOpen,
  } = useKioskStore();

  useEffect(() => {
    if (kiosks.length === 0) {
      fetchKiosks();
    }
  }, [kiosks.length, fetchKiosks]);

  const currentKiosk =
    kiosks.find((k) => k.id === activeKioskId) ||
    kiosks[0] || {
      id: activeKioskId,
      name: 'الكشك',
      isOpen: true,
      openingHours: '8:00 ص - 4:00 م',
      estimatedWaitMins: 15,
      isRushMode: false,
      phone: '01123456780',
      imageUrl: '',
      acceptsCash: true,
      acceptsOnline: false,
      paymentPolicy: 'both',
      walletNumber: '',
      instapayHandle: '',
      acceptsWallet: true,
      acceptsInstapay: true,
    };

  // Operational settings
  const [waitTime, setLocalWaitTime] = useState(currentKiosk.estimatedWaitMins || 15);
  const [isRushMode, setIsRushMode] = useState(currentKiosk.isRushMode || false);
  const [openingHours, setOpeningHours] = useState(currentKiosk.openingHours || '8:00 ص - 4:00 م');
  const [phone, setPhone] = useState(currentKiosk.phone || '01123456780');
  const [imageUrl, setImageUrl] = useState(currentKiosk.imageUrl || '');

  // Payment Configuration Settings
  const [acceptsCash, setAcceptsCash] = useState(currentKiosk.acceptsCash !== false);
  const [acceptsOnline, setAcceptsOnline] = useState(currentKiosk.acceptsOnline === true);
  const [paymentPolicy, setPaymentPolicy] = useState<'both' | 'cash_only' | 'online_only'>(
    currentKiosk.paymentPolicy || 'both'
  );
  const [walletNumber, setWalletNumber] = useState(currentKiosk.walletNumber || '');
  const [instapayHandle, setInstapayHandle] = useState(currentKiosk.instapayHandle || '');
  const [acceptsWallet, setAcceptsWallet] = useState(currentKiosk.acceptsWallet !== false);
  const [acceptsInstapay, setAcceptsInstapay] = useState(currentKiosk.acceptsInstapay !== false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentKiosk) {
      setLocalWaitTime(currentKiosk.estimatedWaitMins || 15);
      setIsRushMode(currentKiosk.isRushMode || false);
      setOpeningHours(currentKiosk.openingHours || '8:00 ص - 4:00 م');
      setPhone(currentKiosk.phone || '01123456780');
      setImageUrl(currentKiosk.imageUrl || '');
      setAcceptsCash(currentKiosk.acceptsCash !== false);
      setAcceptsOnline(currentKiosk.acceptsOnline === true);
      setPaymentPolicy(currentKiosk.paymentPolicy || 'both');
      setWalletNumber(currentKiosk.walletNumber || '');
      setInstapayHandle(currentKiosk.instapayHandle || '');
      setAcceptsWallet(currentKiosk.acceptsWallet !== false);
      setAcceptsInstapay(currentKiosk.acceptsInstapay !== false);
    }
  }, [
    currentKiosk.id,
    currentKiosk.estimatedWaitMins,
    currentKiosk.isRushMode,
    currentKiosk.openingHours,
    currentKiosk.phone,
    currentKiosk.imageUrl,
    currentKiosk.acceptsCash,
    currentKiosk.acceptsOnline,
    currentKiosk.paymentPolicy,
    currentKiosk.walletNumber,
    currentKiosk.instapayHandle,
    currentKiosk.acceptsWallet,
    currentKiosk.acceptsInstapay,
  ]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKiosk?.id) return;

    // Validation: At least one payment method enabled
    if (!acceptsCash && !acceptsOnline) {
      setErrorMessage('يجب تفعيل وسيلة دفع واحدة على الأقل للكشك (كاش أو دفع إلكتروني)');
      return;
    }

    // Validation: If online enabled, at least one channel (wallet or instapay) must have a valid number
    if (acceptsOnline) {
      if (!acceptsWallet && !acceptsInstapay) {
        setErrorMessage('عند تفعيل الدفع الإلكتروني، يجب تفعيل محفظة كاش أو انستا باي واحدة على الأقل');
        return;
      }
      if (acceptsWallet && !walletNumber.trim()) {
        setErrorMessage('يرجى إدخال رقم هاتف المحفظة الإلكترونية (فودافون كاش / اتصالات / أورانج / وي)');
        return;
      }
      if (acceptsInstapay && !instapayHandle.trim()) {
        setErrorMessage('يرجى إدخال عنوان أو رقم حساب انستا باي (InstaPay)');
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updateKioskSettings(currentKiosk.id, {
        defaultPrepTimeMins: Number(waitTime),
        openingHours: openingHours.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim() || null,
        acceptsCash,
        acceptsOnline,
        paymentPolicy,
        walletNumber: walletNumber.trim() || null,
        instapayHandle: instapayHandle.trim() || null,
        acceptsWallet,
        acceptsInstapay,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-line/60">
        <h2 className="font-display font-bold text-2xl text-ink">
          إعدادات وحساب الكاشير
        </h2>
        <p className="font-body text-xs text-ink-soft">
          إدارة طرق الدفع، مواعيد العمل، صورة غلاف الكشك، وتفاصيل الحساب
        </p>
      </div>

      {isSaved && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم حفظ جميع إعدادات وخيارات الدفع للكشك بنجاح!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-danger-soft border border-danger/30 text-danger rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cashier Profile & Account Card */}
      <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
        <div className="flex items-center gap-3 pb-4 border-b border-line/60">
          <Avatar name={cashier?.name || 'كاشير'} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base text-ink truncate">
              {cashier?.name || 'موظف الكاشير'}
            </h3>
            <p className="font-body text-xs text-ink-soft truncate">
              {cashier?.email || ''} {cashier?.phone ? `· ${cashier.phone}` : ''}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-body font-semibold px-2.5 py-0.5 rounded-full bg-accent-soft text-accent">
                <Store className="w-3 h-3" />
                <span>{currentKiosk.name}</span>
              </span>
              {currentKiosk.collegeLocation && (
                <span className="text-[10px] font-body text-ink-soft">
                  ({currentKiosk.collegeLocation})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation Rows */}
        <div className="divide-y divide-line/60">
          <Link
            href="/kiosk/history"
            className="flex items-center justify-between p-3 hover:bg-canvas rounded-2xl transition-colors select-none"
          >
            <div className="flex items-center gap-3 text-sm font-body font-semibold text-ink">
              <Archive className="w-4 h-4 text-primary" />
              <span>أوردرات وسجل اليوم</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </Link>

          <Link
            href="/kiosk/menu"
            className="flex items-center justify-between p-3 hover:bg-canvas rounded-2xl transition-colors select-none"
          >
            <div className="flex items-center gap-3 text-sm font-body font-semibold text-ink">
              <UtensilsCrossed className="w-4 h-4 text-accent" />
              <span>إدارة أصناف المنيو</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </Link>

          <Link
            href="/kiosk/notifications"
            className="flex items-center justify-between p-3 hover:bg-canvas rounded-2xl transition-colors select-none"
          >
            <div className="flex items-center gap-3 text-sm font-body font-semibold text-ink">
              <Bell className="w-4 h-4 text-ink-soft" />
              <span>التنبيهات والإشعارات</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </Link>
        </div>

        {/* Big Clear Logout Button */}
        <div className="pt-2 border-t border-line/60">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-danger-soft text-danger hover:bg-danger hover:text-white rounded-2xl font-body font-bold text-sm transition-all duration-200 select-none shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Availability & Rush Mode */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
          <h4 className="font-display font-bold text-base text-ink pb-2 border-b border-line/60">
            حالة استقبال الطلبات
          </h4>

          {/* Open / Closed Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-body text-sm font-bold text-ink">استقبال الطلبات أونلاين</p>
              <p className="font-body text-xs text-ink-soft">إتاحة ظهور الكشك في قائمة الأكشاك المفتوحة للطلاب</p>
            </div>
            <button
              type="button"
              onClick={() => toggleKioskOpen(currentKiosk.id)}
              className={`px-4 py-2 rounded-xl text-xs font-body font-bold border transition-all ${
                currentKiosk.isOpen
                  ? 'bg-accent text-white border-accent'
                  : 'bg-danger text-white border-danger'
              }`}
            >
              {currentKiosk.isOpen ? 'مفتوح' : 'مغلق'}
            </button>
          </div>

          {/* Rush Mode Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-line/60">
            <div>
              <p className="font-body text-sm font-bold text-ink flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span>تفعيل وضع الذروة (Rush Mode)</span>
              </p>
              <p className="font-body text-xs text-ink-soft">
                إضافة +5 دقائق تلقائياً لوقت الانتظار المتوقع أثناء وقت البريك
              </p>
            </div>
            <input
              type="checkbox"
              checked={isRushMode}
              onChange={(e) => setIsRushMode(e.target.checked)}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Payment Options Section (خيارات وإعدادات الدفع للكشك) */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
          <div className="pb-2 border-b border-line/60 flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              <span>خيارات وطرق الدفع للكشك</span>
            </h4>
            <span className="text-[11px] font-body text-ink-soft">
              تظهر للطلاب عند الطلب من كشكك
            </span>
          </div>

          {/* Master Toggles: Cash vs Online */}
          <div className="space-y-3">
            {/* Cash on Pickup Toggle */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-line bg-canvas hover:bg-line/20 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-primary-ink" />
                <div>
                  <p className="font-body text-xs font-bold text-ink">قبول الدفع كاش عند الاستلام</p>
                  <p className="font-body text-[10px] text-ink-soft">الطلب أولاً ثم دفع الحساب عند الشباك</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsCash}
                onChange={(e) => setAcceptsCash(e.target.checked)}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>

            {/* Online Payment Toggle */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-line bg-canvas hover:bg-line/20 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-body text-xs font-bold text-ink">قبول الدفع الإلكتروني المسبق</p>
                  <p className="font-body text-[10px] text-ink-soft">تحويل عبر محفظة كاش أو انستا باي مع إرفاق الإيصال</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsOnline}
                onChange={(e) => setAcceptsOnline(e.target.checked)}
                className="w-5 h-5 accent-accent rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Payment Policy Selector (When both are enabled) */}
          {acceptsCash && acceptsOnline && (
            <div className="p-3.5 rounded-2xl bg-canvas border border-line space-y-2.5">
              <p className="font-body text-xs font-bold text-ink flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>سياسة الدفع للطلاب:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentPolicy('both')}
                  className={`p-2 rounded-xl text-xs font-body font-bold border transition-all text-center ${
                    paymentPolicy === 'both'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-surface text-ink-soft border-line hover:bg-canvas'
                  }`}
                >
                  إتاحة الاختيار للطالب (موصى به)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPolicy('cash_only')}
                  className={`p-2 rounded-xl text-xs font-body font-bold border transition-all text-center ${
                    paymentPolicy === 'cash_only'
                      ? 'bg-primary text-primary-ink border-primary shadow-xs'
                      : 'bg-surface text-ink-soft border-line hover:bg-canvas'
                  }`}
                >
                  إلزام الكاش فقط
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPolicy('online_only')}
                  className={`p-2 rounded-xl text-xs font-body font-bold border transition-all text-center ${
                    paymentPolicy === 'online_only'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-surface text-ink-soft border-line hover:bg-canvas'
                  }`}
                >
                  إلزام الإلكتروني فقط
                </button>
              </div>
            </div>
          )}

          {/* Online Accounts Setup (When online payment is enabled) */}
          {acceptsOnline && (
            <div className="pt-3 border-t border-line/60 space-y-4 animate-in fade-in duration-200">
              <p className="font-body text-xs font-bold text-ink">
                أرقام الحسابات للتحويل (تظهر للطالب مع زر نسخ سريع):
              </p>

              {/* 1. Mobile Wallet Account */}
              <div className="bg-canvas border border-line rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-body text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={acceptsWallet}
                      onChange={(e) => setAcceptsWallet(e.target.checked)}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span>محفظة كاش (فودافون كاش / اتصالات / أورانج / وي)</span>
                  </label>
                </div>
                {acceptsWallet && (
                  <div>
                    <label className="block text-[11px] font-body text-ink-soft mb-1">
                      رقم الهاتف المسجل عليه المحفظة لاستقبال التحويلات:
                    </label>
                    <input
                      type="tel"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent dir-ltr text-right"
                    />
                  </div>
                )}
              </div>

              {/* 2. InstaPay Account */}
              <div className="bg-canvas border border-line rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-body text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={acceptsInstapay}
                      onChange={(e) => setAcceptsInstapay(e.target.checked)}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span>انستا باي (InstaPay)</span>
                  </label>
                </div>
                {acceptsInstapay && (
                  <div>
                    <label className="block text-[11px] font-body text-ink-soft mb-1">
                      عنوان أو رقم انستا باي الخاص بالكشك (IPA / Phone):
                    </label>
                    <input
                      type="text"
                      value={instapayHandle}
                      onChange={(e) => setInstapayHandle(e.target.value)}
                      placeholder="username@instapay أو رقم الهاتف"
                      className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent dir-ltr text-right"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kiosk Cover Image Section */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
          <div className="pb-2 border-b border-line/60 flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent" />
              <span>صورة غلاف الكشك</span>
            </h4>
            <span className="text-[11px] font-body text-ink-soft">
              تظهر للطلاب في دليل الأكشاك
            </span>
          </div>

          <ImageUploadDropzone
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            onClear={() => setImageUrl('')}
          />
        </div>

        {/* Operational Time Estimates */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
          <h4 className="font-display font-bold text-base text-ink pb-2 border-b border-line/60 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-ink" />
            <span>متوسط وقت الانتظار المعروض للطلاب</span>
          </h4>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-body text-xs font-bold text-ink">
                الوقت المتوقع لتحضير الأوردر:
              </label>
              <span className="font-mono text-base font-bold text-primary-ink font-mono-nums">
                {waitTime} دقيقة
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={waitTime}
              onChange={(e) => setLocalWaitTime(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-ink-soft mt-1">
              <span>5 د (سريع)</span>
              <span>15 د (عادي)</span>
              <span>30 د (زحمة)</span>
            </div>
          </div>

          <Input
            label="مواعيد العمل"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="مفتوح حتى 4:00 م"
          />

          <Input
            label="رقم هاتف الكشك (لإدارة الحرم الجامعي)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="w-full shadow-warm"
        >
          <Save className="w-4 h-4 ml-1.5" />
          <span>حفظ التعديلات</span>
        </Button>
      </form>
    </div>
  );
}
