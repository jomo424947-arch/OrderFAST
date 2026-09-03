'use client';

import React, { useState, useEffect } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import {
  Save,
  Clock,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

export default function CashierSettingsPage() {
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
    };

  const [waitTime, setLocalWaitTime] = useState(currentKiosk.estimatedWaitMins || 15);
  const [isRushMode, setIsRushMode] = useState(currentKiosk.isRushMode || false);
  const [openingHours, setOpeningHours] = useState(currentKiosk.openingHours || '8:00 ص - 4:00 م');
  const [phone, setPhone] = useState(currentKiosk.phone || '01123456780');
  const [imageUrl, setImageUrl] = useState(currentKiosk.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (currentKiosk) {
      setLocalWaitTime(currentKiosk.estimatedWaitMins || 15);
      setIsRushMode(currentKiosk.isRushMode || false);
      setOpeningHours(currentKiosk.openingHours || '8:00 ص - 4:00 م');
      setPhone(currentKiosk.phone || '01123456780');
      setImageUrl(currentKiosk.imageUrl || '');
    }
  }, [
    currentKiosk.id,
    currentKiosk.estimatedWaitMins,
    currentKiosk.isRushMode,
    currentKiosk.openingHours,
    currentKiosk.phone,
    currentKiosk.imageUrl,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKiosk?.id) return;

    try {
      setIsSaving(true);
      await updateKioskSettings(currentKiosk.id, {
        defaultPrepTimeMins: Number(waitTime),
        openingHours: openingHours.trim(),
        phone: phone.trim(),
        imageUrl: imageUrl.trim() || null,
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-line/60">
        <h2 className="font-display font-bold text-2xl text-ink">
          إعدادات الكشك
        </h2>
        <p className="font-body text-xs text-ink-soft">
          التحكم في مواعيد العمل، صورة غلاف الكشك، ومتوسط وقت التحضير
        </p>
      </div>

      {isSaved && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>تم حفظ إعدادات وصورة الكشك بنجاح!</span>
        </div>
      )}

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

