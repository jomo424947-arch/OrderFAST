'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLLEGES } from '@/lib/constants';
import { ChevronRight, Save, BellRing, Phone, Mail, User } from 'lucide-react';

export default function StudentSettingsPage() {
  const router = useRouter();
  const { student } = useAuthStore();

  const [name, setName] = useState(student?.name || '');
  const [college, setCollege] = useState(student?.college || COLLEGES[0]);
  const [phone, setPhone] = useState(student?.phone || '01012345678');
  const [orderReadyAlerts, setOrderReadyAlerts] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header */}
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
            إعدادات الحساب
          </h3>
          <p className="font-body text-xs text-ink-soft">
            بياناتك الشخصية وتفضيلات الإشعارات
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Personal Info Box */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-4 text-right">
          <h4 className="font-display font-bold text-sm text-ink pb-2 border-b border-line/60">
            البيانات الجامعية
          </h4>

          <Input
            label="الاسم الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-4 h-4" />}
          />

          <div className="w-full text-right">
            <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
              الكلية
            </label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              {COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="رقم الهاتف (للتواصل في حالة الطوارئ)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="w-4 h-4" />}
          />

          <Input
            label="البريد الجامعي (غير قابل للتعديل)"
            value={student?.email || ''}
            disabled
            className="opacity-70 bg-canvas cursor-not-allowed"
            icon={<Mail className="w-4 h-4" />}
          />
        </div>

        {/* Notification Preferences */}
        <div className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-3 text-right">
          <h4 className="font-display font-bold text-sm text-ink pb-2 border-b border-line/60 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary-ink" />
            <span>تفضيلات الإشعارات والتنبيه</span>
          </h4>

          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <p className="font-body text-xs font-bold text-ink">تنبيه جاهزية الأوردر</p>
              <p className="font-body text-[11px] text-ink-soft">إشعار فوري عند اكتمال تجهيز طلبك</p>
            </div>
            <input
              type="checkbox"
              checked={orderReadyAlerts}
              onChange={(e) => setOrderReadyAlerts(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between py-2 cursor-pointer border-t border-line/50">
            <div>
              <p className="font-body text-xs font-bold text-ink">تنبيهات وقت الانتظار والازدحام</p>
              <p className="font-body text-[11px] text-ink-soft">تحديث وقت الانتظار في حالة الزحام بالكشك</p>
            </div>
            <input
              type="checkbox"
              checked={delayAlerts}
              onChange={(e) => setDelayAlerts(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full">
          <Save className="w-4 h-4 ml-1" />
          <span>{isSaved ? 'تم حفظ التعديلات بنجاح!' : 'حفظ التعديلات'}</span>
        </Button>
      </form>
    </div>
  );
}
