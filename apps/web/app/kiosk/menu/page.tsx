'use client';

import React, { useState, useMemo } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { MenuItem, MenuCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Coffee,
  Utensils,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CashierMenuManagementPage() {
  const {
    activeKioskId,
    kiosks,
    menuItems,
    categories,
    toggleItemAvailability,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useKioskStore();

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId) || kiosks[0];

  const kioskItems = useMemo(() => {
    return menuItems.filter((i) => i.kioskId === currentKiosk.id || !i.kioskId);
  }, [menuItems, currentKiosk.id]);

  const underReviewCount = kioskItems.filter((i) => i.isUnderReview).length;

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || 'cat-hot-drinks');
  const [formPrice, setFormPrice] = useState('15');
  const [formPrepTime, setFormPrepTime] = useState('5');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(categories[0]?.id || 'cat-hot-drinks');
    setFormPrice('15');
    setFormPrepTime('5');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.categoryId);
    setFormPrice(item.price.toString());
    setFormPrepTime(item.preparationTimeMins?.toString() || '5');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: formName.trim(),
        categoryId: formCategory,
        price: Number(formPrice) || 10,
        preparationTimeMins: Number(formPrepTime) || 5,
      });
      setToastMessage('تم تحديث بيانات الصنف بنجاح');
    } else {
      addMenuItem({
        kioskId: currentKiosk.id,
        categoryId: formCategory,
        name: formName.trim(),
        price: Number(formPrice) || 10,
        isAvailable: true,
        preparationTimeMins: Number(formPrepTime) || 5,
      });
      setToastMessage('تمت إضافة الصنف بنجاح وحالته الآن قيد المراجعة');
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = (itemId: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف صنف "${name}" من المنيو؟`)) {
      deleteMenuItem(itemId);
      setToastMessage('تم حذف الصنف من المنيو');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header matching design reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            إدارة المنيو
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {currentKiosk.name} · {kioskItems.length} صنف{' '}
            {underReviewCount > 0 && `· ${underReviewCount} قيد المراجعة`}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 ml-1.5" />
          <span>إضافة صنف جديد</span>
        </Button>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Categories and Item Rows matching design reference */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const itemsInCat = kioskItems.filter((i) => i.categoryId === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm space-y-2">
              <h4 className="font-display font-bold text-base text-ink pb-2 border-b border-line/60">
                {cat.name}
              </h4>

              <div className="divide-y divide-line/60">
                {itemsInCat.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    {/* Item Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-canvas border border-line flex items-center justify-center text-ink-soft flex-shrink-0">
                        {item.categoryId.includes('drink') ? (
                          <Coffee className="w-4 h-4 stroke-[1.5]" />
                        ) : (
                          <Utensils className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-body font-bold text-sm text-ink truncate">
                            {item.name}
                          </p>
                          {item.isUnderReview && (
                            <span className="bg-primary-soft text-primary-ink text-[10px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                              قيد المراجعة
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-ink-soft font-semibold mt-0.5">
                          {item.isAvailable ? (
                            formatEGP(item.price)
                          ) : (
                            <span className="text-danger">غير متاح دلوقتي</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, Toggle Availability */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Availability Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleItemAvailability(item.id)}
                        className={`p-1.5 rounded-xl border text-xs font-body font-semibold transition-all ${
                          item.isAvailable
                            ? 'bg-accent-soft text-accent border-accent/30 hover:bg-accent-soft/80'
                            : 'bg-canvas text-ink-soft border-line hover:bg-line/40'
                        }`}
                        title={item.isAvailable ? 'متاح للطلب' : 'غير متاح'}
                      >
                        {item.isAvailable ? 'متاح' : 'معطل'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
                        aria-label="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="w-8 h-8 rounded-xl bg-danger-soft/60 border border-danger/30 flex items-center justify-center text-danger hover:bg-danger-soft transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button for Adding Item */}
      <button
        type="button"
        onClick={handleOpenAdd}
        className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-ink flex items-center justify-center shadow-floating transition-all active:scale-95 group"
        aria-label="إضافة صنف جديد"
      >
        <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمنيو'}
        description="سيتم إرسال الأصناف الجديدة للمراجعة وتفعيلها مباشرة على التطبيق."
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-right">
          <Input
            label="اسم الصنف"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="مثال: شاي بالنعناع أو سندوتش رومي"
            required
          />

          <div className="w-full text-right">
            <label className="block font-body text-xs font-medium text-ink-soft mb-1.5">
              التصنيف
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="السعر (ج.م)"
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              required
            />
            <Input
              label="وقت التحضير (دقائق)"
              type="number"
              value={formPrepTime}
              onChange={(e) => setFormPrepTime(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
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
