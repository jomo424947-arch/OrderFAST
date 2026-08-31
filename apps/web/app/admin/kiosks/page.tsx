'use client';

import React, { useState } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { COLLEGES } from '@/lib/constants';
import {
  Plus,
  Store,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Star,
} from 'lucide-react';

export default function AdminKiosksPage() {
  const { kiosks, cashiers, toggleKioskOpen, addKiosk, addCashier } = useKioskStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [kioskName, setKioskName] = useState('');
  const [collegeLocation, setCollegeLocation] = useState(COLLEGES[0]);
  const [campusZone, setCampusZone] = useState('');
  const [category, setCategory] = useState('مشروبات وسناكس');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('مفتوح حتى 5:00 م');
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');

  const handleOpenAddModal = () => {
    setKioskName('');
    setCollegeLocation(COLLEGES[0]);
    setCampusZone('');
    setCategory('مشروبات وسناكس');
    setPhone('');
    setOpeningHours('مفتوح حتى 5:00 م');
    setCashierName('');
    setCashierEmail('');
    setIsModalOpen(true);
  };

  const handleCreateKioskAndCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskName.trim() || !cashierName.trim() || !cashierEmail.trim()) return;

    // 1. Add Kiosk
    const newKiosk = addKiosk({
      name: kioskName.trim(),
      collegeLocation,
      campusZone: campusZone.trim() || 'الساحة الرئيسية',
      category,
      isOpen: true,
      openingHours: openingHours.trim() || 'مفتوح حتى 5:00 م',
      estimatedWaitMins: 10,
      ordersAheadCount: 0,
      rating: 5.0,
      acceptsOnlineOrders: true,
      isRushMode: false,
      phone: phone.trim() || undefined,
    });

    // 2. Add Cashier assigned to new Kiosk
    addCashier({
      name: cashierName.trim(),
      email: cashierEmail.trim(),
      role: 'cashier',
      kioskId: newKiosk.id,
      kioskName: newKiosk.name,
    });

    setIsModalOpen(false);
    setToastMessage(`تمت إضافة "${newKiosk.name}" وتعيين الكاشير المسؤول بنجاح`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            إدارة الأكشاك والكاشيرات
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            إجمالي {kiosks.length} أكشاك جامعية · {cashiers.length} حساب كاشير نشط
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 ml-1.5" />
          <span>إضافة كشك وكاشير جديد</span>
        </Button>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Kiosks Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kiosks.map((kiosk) => {
          const assignedCashier = cashiers.find((c) => c.kioskId === kiosk.id);

          return (
            <div
              key={kiosk.id}
              className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Kiosk Name & Status Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-line/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-canvas border border-line flex items-center justify-center text-accent">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-ink">
                        {kiosk.name}
                      </h3>
                      <p className="font-body text-xs text-ink-soft">
                        {kiosk.category}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleKioskOpen(kiosk.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-all ${
                      kiosk.isOpen
                        ? 'bg-accent-soft text-accent border-accent/30 hover:bg-accent-soft/80'
                        : 'bg-danger-soft text-danger border-danger/30 hover:bg-danger-soft/80'
                    }`}
                  >
                    {kiosk.isOpen ? 'مفتوح للطلب' : 'مغلق حالياً'}
                  </button>
                </div>

                {/* Details list */}
                <div className="mt-3 space-y-2 text-xs font-body text-ink-soft">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />
                    <span>
                      {kiosk.collegeLocation}{' '}
                      {kiosk.campusZone && `· ${kiosk.campusZone}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />
                    <span>
                      {kiosk.openingHours} (متوسط انتظار {kiosk.estimatedWaitMins} د)
                    </span>
                  </div>

                  {kiosk.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />
                      <span className="font-mono">{kiosk.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Cashier Box */}
              <div className="bg-canvas border border-line rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-primary-ink">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-body font-bold text-xs text-ink">
                      {assignedCashier?.name || 'لم يُحدد كاشير'}
                    </p>
                    <p className="font-body text-[10px] text-ink-soft">
                      {assignedCashier?.email || 'لا يوجد بريد مسجل'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-ink-soft">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span>{kiosk.rating}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Kiosk + Cashier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة كشك جديد وكاشير مسؤول"
        description="أنشئ حساب كشك وكاشير جديد لإضافته لمنظومة الحرم الجامعي فوراً."
      >
        <form onSubmit={handleCreateKioskAndCashier} className="space-y-4 text-right">
          <div className="border-b border-line/60 pb-2">
            <h4 className="font-body font-bold text-xs text-ink mb-1">
              ١. بيانات الكشك
            </h4>
          </div>

          <Input
            label="اسم الكشك"
            value={kioskName}
            onChange={(e) => setKioskName(e.target.value)}
            placeholder="مثال: كافيه الصيدلة"
            required
          />

          <div className="w-full text-right">
            <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
              موقع الكلية
            </label>
            <select
              value={collegeLocation}
              onChange={(e) => setCollegeLocation(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              {COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="المنطقة / المكان بالتفصيل"
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              placeholder="مثال: الدور الأرضي مبنى أ"
            />
            <Input
              label="تصنيف الكشك"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مشروبات وساندوتشات"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="مواعيد العمل"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="مفتوح حتى 4:00 م"
            />
            <Input
              label="رقم الهاتف للتواصل"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
            />
          </div>

          <div className="border-b border-line/60 pb-2 pt-2">
            <h4 className="font-body font-bold text-xs text-ink mb-1">
              ٢. بيانات الكاشير المسؤول
            </h4>
          </div>

          <Input
            label="اسم الكاشير"
            value={cashierName}
            onChange={(e) => setCashierName(e.target.value)}
            placeholder="اسم مسؤول الكشك"
            required
          />

          <Input
            label="البريد الإلكتروني للكاشير"
            type="email"
            value={cashierEmail}
            onChange={(e) => setCashierEmail(e.target.value)}
            placeholder="cashier.pharmacy@kiosks.sphinx.edu.eg"
            required
          />

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              إنشاء الكشك والكاشير
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
