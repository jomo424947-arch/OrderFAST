'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { COLLEGES } from '@/lib/constants';
import {
  Plus,
  Store,
  User,
  UserPlus,
  UserMinus,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Star,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

export default function AdminKiosksPage() {
  const {
    kiosks,
    kiosksWithStaff,
    staffList,
    toggleKioskOpen,
    fetchKiosksWithStaff,
    fetchStaffList,
    createKiosk,
    updateKioskSettings,
    assignStaff,
    removeStaff,
  } = useKioskStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedKioskForAssign, setSelectedKioskForAssign] = useState<any>(null);
  const [selectedStaffUserId, setSelectedStaffUserId] = useState<string>('');
  const [selectedStaffRole, setSelectedStaffRole] = useState<'cashier' | 'owner'>('cashier');

  // Image Edit Modal State (Admin)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedKioskForImage, setSelectedKioskForImage] = useState<any>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSavingImage, setIsSavingImage] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchKiosksWithStaff();
    fetchStaffList();
  }, [fetchKiosksWithStaff, fetchStaffList]);

  const displayedKiosks = kiosksWithStaff.length > 0 ? kiosksWithStaff : kiosks;

  // New Kiosk Form State
  const [kioskName, setKioskName] = useState('');
  const [collegeLocation, setCollegeLocation] = useState(COLLEGES[0]);
  const [campusZone, setCampusZone] = useState('');
  const [category, setCategory] = useState('مشروبات وسناكس');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('8:00 ص - 5:00 م');
  const [newKioskImageUrl, setNewKioskImageUrl] = useState('');

  const handleOpenAddModal = () => {
    setKioskName('');
    setCollegeLocation(COLLEGES[0]);
    setCampusZone('');
    setCategory('مشروبات وسناكس');
    setPhone('');
    setOpeningHours('8:00 ص - 5:00 م');
    setNewKioskImageUrl('');
    setIsAddModalOpen(true);
  };

  const handleCreateKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskName.trim()) return;

    try {
      setIsSubmitting(true);
      const newKiosk = await createKiosk({
        name: kioskName.trim(),
        collegeLocation,
        campusZone: campusZone.trim() || 'الساحة الرئيسية',
        category,
        openingHours: openingHours.trim() || '8:00 ص - 5:00 م',
        phone: phone.trim() || undefined,
        imageUrl: newKioskImageUrl.trim() || undefined,
      });

      await fetchKiosksWithStaff();
      setIsAddModalOpen(false);
      setToastMessage(`تمت إضافة "${newKiosk.name}" بنجاح! يمكنك الآن تعيين كاشير له.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الكشك');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenImageModal = (kiosk: any) => {
    setSelectedKioskForImage(kiosk);
    setEditImageUrl(kiosk.imageUrl || '');
    setIsImageModalOpen(true);
  };

  const handleUpdateImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKioskForImage) return;

    try {
      setIsSavingImage(true);
      await updateKioskSettings(selectedKioskForImage.id, {
        imageUrl: editImageUrl.trim() || null,
      });
      await fetchKiosksWithStaff();
      setIsImageModalOpen(false);
      setToastMessage(`تم تحديث صورة كشك "${selectedKioskForImage.name}" بنجاح!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث صورة الكشك');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleOpenAssignModal = (kiosk: any) => {
    setSelectedKioskForAssign(kiosk);
    if (staffList.length > 0) {
      setSelectedStaffUserId(staffList[0].id);
    } else {
      setSelectedStaffUserId('');
    }
    setSelectedStaffRole('cashier');
    setIsAssignModalOpen(true);
  };

  const handleAssignStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKioskForAssign || !selectedStaffUserId) return;

    try {
      setIsSubmitting(true);
      await assignStaff(selectedKioskForAssign.id, selectedStaffUserId, selectedStaffRole);
      setIsAssignModalOpen(false);
      setToastMessage(`تم تعيين الموظف بنجاح لكشك "${selectedKioskForAssign.name}"`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'فشل تعيين الموظف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (kioskId: string, userId: string, staffName: string) => {
    if (!confirm(`هل أنت متأكد من إلغاء تعيين الموظف "${staffName}" من هذا الكشك؟`)) return;

    try {
      await removeStaff(kioskId, userId);
      setToastMessage(`تم إلغاء تعيين الموظف "${staffName}" بنجاح`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء تعيين الموظف');
    }
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
            إجمالي {displayedKiosks.length} أكشاك جامعية · {displayedKiosks.reduce((s, k) => s + (k.staff?.length || 0), 0)} موظف معين
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 ml-1.5" />
          <span>إضافة كشك جديد</span>
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
        {displayedKiosks.map((kiosk: any) => {
          const staffMembers = kiosk.staff || [];

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
                    className={`px-3 py-1.5 rounded-full text-xs font-body font-bold border transition-all ${kiosk.isOpen
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
                      {kiosk.openingHours}
                    </span>
                  </div>

                  {kiosk.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-ink-soft flex-shrink-0" />
                      <span className="font-mono">{kiosk.phone}</span>
                    </div>
                  )}

                  {/* Kiosk Image Admin Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-line/60 mt-2">
                    <div className="flex items-center gap-1.5 text-ink-soft">
                      <ImageIcon className="w-3.5 h-3.5 text-accent" />
                      <span>صورة الكشك:</span>
                      <span className="font-semibold text-ink">
                        {kiosk.imageUrl ? 'صورة مخصصة' : 'صورة ذكية افتراضية'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenImageModal(kiosk)}
                      className="inline-flex items-center gap-1 text-[11px] font-body font-bold text-accent hover:underline bg-accent-soft/70 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>تغيير الصورة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Assigned Staff Box */}
              <div className="bg-canvas border border-line rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-ink" />
                    <span className="font-body font-bold text-xs text-ink">
                      طاقم الكاشير المسؤول
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(kiosk)}
                    className="inline-flex items-center gap-1 text-[11px] font-body font-bold text-accent hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>تعيين موظف</span>
                  </button>
                </div>

                {staffMembers.length > 0 ? (
                  <div className="space-y-2">
                    {staffMembers.map((member: any) => (
                      <div
                        key={member.id || member.userId}
                        className="bg-surface border border-line/60 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-body font-bold text-xs text-ink truncate">
                              {member.name || member.fullName || 'موظف بدون اسم'}
                            </p>
                            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                              {member.role === 'owner' ? 'مالك الكشك' : 'كاشير'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] font-mono text-ink-soft">
                            {member.email && <span>{member.email}</span>}
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-ink-soft" />
                                {member.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveStaff(
                              kiosk.id,
                              member.userId,
                              member.name || member.fullName || 'الموظف'
                            )
                          }
                          title="إلغاء التعيين"
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors flex-shrink-0"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="font-body text-xs text-ink-soft mb-2">
                      لا يوجد كاشير معين لهذا الكشك بعد
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssignModal(kiosk)}
                      className="w-full text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 ml-1.5 text-accent" />
                      <span>تعيين كاشير الآن</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Add Kiosk Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة كشك / كافيه جديد"
        description="أنشئ كشك جديد في الحرم الجامعي، ويمكنك لاحقاً تعيين كاشيرات له."
      >
        <form onSubmit={handleCreateKiosk} className="space-y-4 text-right">
          <Input
            label="اسم الكشك أو الكافيه"
            value={kioskName}
            onChange={(e) => setKioskName(e.target.value)}
            placeholder="مثال: كافيه الهندسة"
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

          <Input
            label="المنطقة داخل الكلية (اختياري)"
            value={campusZone}
            onChange={(e) => setCampusZone(e.target.value)}
            placeholder="مثال: بجوار مبنى الورش - الساحة الرئيسية"
          />

          <Input
            label="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="مثال: مشروبات ساخنة وسناكس"
          />

          <Input
            label="مواعيد العمل"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="8:00 ص - 5:00 م"
          />

          <Input
            label="رقم هاتف الكشك للتواصل (اختياري)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            dir="ltr"
          />

          <div className="space-y-1.5 text-right">
            <label className="block font-body text-xs font-medium text-ink-soft">
              صورة غلاف الكشك (اختياري)
            </label>
            <ImageUploadDropzone
              value={newKioskImageUrl}
              onChange={(url) => setNewKioskImageUrl(url)}
              onClear={() => setNewKioskImageUrl('')}
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="flex-1"
            >
              إنشاء الكشك
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Assign Staff Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`تعيين موظف لكشك: ${selectedKioskForAssign?.name || ''}`}
        description="اختر أحد موظفي الكاشير المسجلين في المنصة لربطه بهذا الكشك."
      >
        <form onSubmit={handleAssignStaffSubmit} className="space-y-4 text-right">
          {staffList.length > 0 ? (
            <>
              <div className="w-full text-right">
                <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
                  اختر الموظف / الكاشير
                </label>
                <select
                  value={selectedStaffUserId}
                  onChange={(e) => setSelectedStaffUserId(e.target.value)}
                  className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- اختر موظفاً من القائمة --
                  </option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.email || 'بدون بريد'}) {s.phone ? `· هاتف: ${s.phone}` : ''}{' '}
                      {s.assignment ? `[معين حالياً لـ ${s.assignment.kioskName}]` : '[غير معين]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full text-right">
                <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
                  الدور داخل الكشك
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffRole('cashier')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-body font-bold transition-all ${
                      selectedStaffRole === 'cashier'
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-canvas text-ink border-line hover:border-accent'
                    }`}
                  >
                    كاشير (Cashier)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffRole('owner')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-body font-bold transition-all ${
                      selectedStaffRole === 'owner'
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-canvas text-ink border-line hover:border-accent'
                    }`}
                  >
                    مالك الكشك (Owner)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-line/60">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={!selectedStaffUserId}
                  className="flex-1"
                >
                  تأكيد التعيين
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-canvas border border-line rounded-2xl p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-primary-ink mx-auto" />
              <p className="font-body font-bold text-xs text-ink">
                لا يوجد موظفون مسجلون في النظام حالياً
              </p>
              <p className="font-body text-[11px] text-ink-soft leading-relaxed">
                اطلب من الكاشير إنشاء حسابه أولاً من صفحة التسجيل <code>/auth/register</code> باختيار تبويب &quot;كاشير&quot;، وسيظهر في هذه القائمة فوراً لتعيينه.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="mt-2"
              >
                إغلاق
              </Button>
            </div>
          )}
        </form>
      </Modal>

      {/* 3. Edit Kiosk Image Modal (Admin) */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`تغيير صورة كشك: ${selectedKioskForImage?.name || ''}`}
        description="ارفع صورة جديدة من جهازك ليتم عرضها للطلاب في دليل الأكشاك."
      >
        <form onSubmit={handleUpdateImageSubmit} className="space-y-4 text-right">
          <ImageUploadDropzone
            value={editImageUrl}
            onChange={(url) => setEditImageUrl(url)}
            onClear={() => setEditImageUrl('')}
          />

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingImage}
              className="flex-1"
            >
              حفظ الصورة
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsImageModalOpen(false)}
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
