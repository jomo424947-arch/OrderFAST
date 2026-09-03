'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Tag,
  Flame,
  Sparkles,
  Package,
  Layers,
  Percent,
  Minus,
} from 'lucide-react';

export default function CashierMenuManagementPage() {
  const {
    activeKioskId,
    kiosks,
    menuItems,
    categories,
    fetchKiosks,
    fetchMenu,
    toggleItemAvailability,
    createCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useKioskStore();

  useEffect(() => {
    fetchKiosks();
  }, [fetchKiosks]);

  useEffect(() => {
    if (activeKioskId) {
      fetchMenu(activeKioskId, true);
    }
  }, [activeKioskId, fetchMenu]);

  const currentKiosk = kiosks.find((k) => k.id === activeKioskId) || kiosks[0] || {
    id: activeKioskId,
    name: 'الكشك',
    isOpen: true,
  };

  const kioskItems = useMemo(() => {
    return menuItems.filter((i) => i.kioskId === currentKiosk.id || !i.kioskId);
  }, [menuItems, currentKiosk.id]);

  const underReviewCount = kioskItems.filter((i) => i.isUnderReview).length;

  const POPULAR_CATEGORIES = ['ساندوتشات وسناكس', 'مشروبات ساخنة', 'مشروبات باردة', 'حلويات', 'وجبات سريعة'];

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || '__NEW__');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [formPrice, setFormPrice] = useState('15');
  const [formPrepTime, setFormPrepTime] = useState('5');
  const [formHasOffer, setFormHasOffer] = useState(false);
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formOfferTag, setFormOfferTag] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combo Deal Modal State
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<MenuItem | null>(null);
  const [comboName, setComboName] = useState('');
  const [comboCategory, setComboCategory] = useState(categories[0]?.id || '');
  const [selectedComboItems, setSelectedComboItems] = useState<
    { itemId: string; name: string; price: number; quantity: number }[]
  >([]);
  const [comboSellingPrice, setComboSellingPrice] = useState('');
  const [comboOfferTag, setComboOfferTag] = useState('');
  const [comboPrepTime, setComboPrepTime] = useState('8');

  const comboOriginalPrice = useMemo(() => {
    return selectedComboItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [selectedComboItems]);

  const handleOpenAddCombo = () => {
    setEditingCombo(null);
    setComboName('');
    setComboCategory(categories[0]?.id || '');
    setSelectedComboItems([]);
    setComboSellingPrice('');
    setComboOfferTag('كومبو توفير');
    setComboPrepTime('8');
    setIsComboModalOpen(true);
  };

  const handleOpenEditCombo = (item: MenuItem) => {
    setEditingCombo(item);
    setComboName(item.name);
    setComboCategory(item.categoryId);
    const existing = (item.comboItems || []).map((ci) => {
      const foundItem = kioskItems.find((k) => k.id === ci.itemId);
      return {
        itemId: ci.itemId,
        name: ci.name,
        price: foundItem?.price || 15,
        quantity: ci.quantity,
      };
    });
    setSelectedComboItems(existing);
    setComboSellingPrice(item.price.toString());
    setComboOfferTag(item.offerTag || 'كومبو توفير');
    setComboPrepTime(item.preparationTimeMins?.toString() || '8');
    setIsComboModalOpen(true);
  };

  const handleAddItemToCombo = (itemId: string) => {
    if (!itemId) return;
    const found = kioskItems.find((i) => i.id === itemId && !i.isCombo);
    if (!found) return;

    setSelectedComboItems((prev) => {
      const existing = prev.find((p) => p.itemId === itemId);
      if (existing) {
        return prev.map((p) =>
          p.itemId === itemId ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { itemId: found.id, name: found.name, price: found.price, quantity: 1 }];
    });
  };

  const handleUpdateComboItemQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedComboItems((prev) => prev.filter((p) => p.itemId !== itemId));
    } else {
      setSelectedComboItems((prev) =>
        prev.map((p) => (p.itemId === itemId ? { ...p, quantity: qty } : p))
      );
    }
  };

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) return;
    if (selectedComboItems.length === 0) {
      alert('يرجى اختيار صنف واحد على الأقل في العرض');
      return;
    }

    try {
      setIsSubmitting(true);
      const sellPrice = Number(comboSellingPrice) || 20;
      const targetCatId = comboCategory || categories[0]?.id || '__NEW__';

      if (editingCombo) {
        await updateMenuItem({
          ...editingCombo,
          name: comboName.trim(),
          categoryId: targetCatId,
          price: sellPrice,
          originalPrice: comboOriginalPrice > sellPrice ? comboOriginalPrice : undefined,
          offerTag: comboOfferTag.trim() || (comboOriginalPrice > sellPrice ? `وفر ${comboOriginalPrice - sellPrice} ج.م` : 'عرض كومبو'),
          isCombo: true,
          comboItems: selectedComboItems.map((it) => ({
            itemId: it.itemId,
            name: it.name,
            quantity: it.quantity,
          })),
          preparationTimeMins: Number(comboPrepTime) || 8,
        });
        setToastMessage('تم تحديث عرض الكومبو بنجاح');
      } else {
        await addMenuItem({
          kioskId: currentKiosk.id,
          name: comboName.trim(),
          categoryId: targetCatId,
          price: sellPrice,
          originalPrice: comboOriginalPrice > sellPrice ? comboOriginalPrice : undefined,
          offerTag: comboOfferTag.trim() || (comboOriginalPrice > sellPrice ? `وفر ${comboOriginalPrice - sellPrice} ج.م` : 'عرض كومبو'),
          isCombo: true,
          comboItems: selectedComboItems.map((it) => ({
            itemId: it.itemId,
            name: it.name,
            quantity: it.quantity,
          })),
          preparationTimeMins: Number(comboPrepTime) || 8,
          isAvailable: true,
          isUnderReview: false,
        });
        setToastMessage('تمت إضافة عرض الكومبو بنجاح');
      }

      await fetchMenu(currentKiosk.id, true);
      setIsComboModalOpen(false);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ عرض الكومبو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    const hasCategories = categories.length > 0;
    setIsCreatingNewCategory(!hasCategories);
    setFormCategory(hasCategories ? categories[0].id : '__NEW__');
    setNewCategoryName(hasCategories ? '' : 'ساندوتشات وسناكس');
    setFormPrice('15');
    setFormPrepTime('5');
    setFormHasOffer(false);
    setFormOriginalPrice('');
    setFormOfferTag('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setIsCreatingNewCategory(false);
    setFormCategory(item.categoryId);
    setNewCategoryName('');
    setFormPrice(item.price.toString());
    setFormPrepTime(item.preparationTimeMins?.toString() || '5');
    const hasOffer = !!(item.originalPrice && item.originalPrice > item.price);
    setFormHasOffer(hasOffer);
    setFormOriginalPrice(item.originalPrice ? item.originalPrice.toString() : '');
    setFormOfferTag(item.offerTag || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setIsSubmitting(true);
      let targetCategoryId = formCategory;

      // If user is adding a new category
      if (isCreatingNewCategory || formCategory === '__NEW__' || categories.length === 0) {
        const catName = newCategoryName.trim();
        if (!catName) {
          alert('يرجى كتابة أو اختيار اسم التصنيف');
          setIsSubmitting(false);
          return;
        }

        // Check if category name already exists in current categories
        const existingCat = categories.find(
          (c) => c.name.trim().toLowerCase() === catName.toLowerCase()
        );

        if (existingCat) {
          targetCategoryId = existingCat.id;
        } else {
          const createdCat = await createCategory(currentKiosk.id, catName);
          targetCategoryId = createdCat.id;
        }
      }

      if (!targetCategoryId) {
        alert('يجب تحديد تصنيف للصنف');
        setIsSubmitting(false);
        return;
      }

      const currentPrice = Number(formPrice) || 10;
      const origPrice = formHasOffer && formOriginalPrice ? Number(formOriginalPrice) : undefined;
      const validOrigPrice = origPrice && origPrice > currentPrice ? origPrice : undefined;
      const finalOfferTag = formHasOffer ? (formOfferTag.trim() || undefined) : undefined;

      if (editingItem) {
        await updateMenuItem({
          ...editingItem,
          name: formName.trim(),
          categoryId: targetCategoryId,
          price: currentPrice,
          originalPrice: validOrigPrice,
          offerTag: finalOfferTag,
          preparationTimeMins: Number(formPrepTime) || 5,
        });
        setToastMessage('تم تحديث بيانات الصنف بنجاح');
      } else {
        await addMenuItem({
          kioskId: currentKiosk.id,
          name: formName.trim(),
          categoryId: targetCategoryId,
          price: currentPrice,
          originalPrice: validOrigPrice,
          offerTag: finalOfferTag,
          preparationTimeMins: Number(formPrepTime) || 5,
          isAvailable: true,
          isUnderReview: true,
        });
        setToastMessage('تمت إضافة الصنف وإرساله للمراجعة بنجاح');
      }

      await fetchMenu(currentKiosk.id, true);
      setIsModalOpen(false);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الصنف');
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAddCombo}
            className="border-accent/50 text-accent hover:bg-accent-soft font-bold shadow-xs"
          >
            <Sparkles className="w-4 h-4 ml-1.5 text-accent" />
            <span>+ إضافة عرض / كومبو</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 ml-1.5" />
            <span>إضافة صنف جديد</span>
          </Button>
        </div>
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
                        {item.isCombo ? (
                          <Package className="w-4 h-4 stroke-[1.8] text-accent" />
                        ) : item.categoryId.includes('drink') ? (
                          <Coffee className="w-4 h-4 stroke-[1.5]" />
                        ) : (
                          <Utensils className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-body font-bold text-sm text-ink truncate">
                            {item.name}
                          </p>

                          {item.isCombo && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md border border-accent/25 whitespace-nowrap">
                              <Package className="w-3 h-3 stroke-[2]" />
                              باقة كومبو
                            </span>
                          )}

                          {item.isUnderReview && (
                            <span className="bg-primary-soft text-primary-ink text-[10px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                              قيد المراجعة
                            </span>
                          )}
                        </div>

                        {/* Combo Items breakdown */}
                        {item.isCombo && item.comboItems && item.comboItems.length > 0 && (
                          <p className="text-[11px] font-body text-ink-soft mt-0.5">
                            يشمل: {item.comboItems.map((c) => `${c.quantity}× ${c.name}`).join(' + ')}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-0.5">
                          {item.isAvailable ? (
                            item.originalPrice && item.originalPrice > item.price ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs text-danger font-black font-mono-nums">
                                  {formatEGP(item.price)}
                                </span>
                                <span className="font-mono text-[11px] text-ink-soft line-through font-mono-nums">
                                  {formatEGP(item.originalPrice)}
                                </span>
                                <span className="text-[10px] font-body font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md border border-accent/20">
                                  {item.offerTag || `وفر ${item.originalPrice - item.price} ج.م`}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-ink-soft font-semibold">
                                {formatEGP(item.price)}
                              </span>
                            )
                          ) : (
                            <span className="text-danger font-body text-xs font-semibold">غير متاح دلوقتي</span>
                          )}
                        </div>
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
                        onClick={() => item.isCombo ? handleOpenEditCombo(item) : handleOpenEdit(item)}
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

          {/* Category Selector / Creator */}
          <div className="w-full text-right space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-body text-xs font-medium text-ink-soft">
                التصنيف
              </label>
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewCategory(!isCreatingNewCategory);
                    if (!isCreatingNewCategory) {
                      setFormCategory('__NEW__');
                      setNewCategoryName('');
                    } else {
                      setFormCategory(categories[0]?.id || '');
                    }
                  }}
                  className="text-[11px] font-body font-bold text-accent hover:underline"
                >
                  {isCreatingNewCategory ? '← اختر من التصنيفات الحالية' : '+ تصنيف جديد'}
                </button>
              )}
            </div>

            {isCreatingNewCategory || categories.length === 0 ? (
              <div className="space-y-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اكتب اسم التصنيف (مثال: ساندوتشات أو مشروبات)"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-body text-ink-soft ml-1">اقتراحات سريعة:</span>
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategoryName(cat)}
                      className={`text-[11px] font-body px-2.5 py-1 rounded-full border transition-all ${
                        newCategoryName === cat
                          ? 'bg-accent text-white border-accent font-bold'
                          : 'bg-canvas text-ink-soft border-line hover:border-accent hover:text-ink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <select
                value={formCategory}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreatingNewCategory(true);
                    setFormCategory('__NEW__');
                  } else {
                    setFormCategory(e.target.value);
                  }
                }}
                className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__NEW__">+ إضافة تصنيف جديد...</option>
              </select>
            )}
          </div>

          {/* Offer & Discount Section */}
          <div className="bg-canvas border border-line/80 rounded-2xl p-3.5 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setFormHasOffer(!formHasOffer)}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" />
                <div>
                  <p className="font-body font-bold text-xs text-ink">تفعيل عرض / خصم على الصنف</p>
                  <p className="font-body text-[11px] text-ink-soft">سيظهر الصنف في قسم العروض بخصم مميز للطلاب</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formHasOffer}
                onChange={(e) => setFormHasOffer(e.target.checked)}
                className="w-4 h-4 accent-accent rounded cursor-pointer"
              />
            </div>

            {formHasOffer && (
              <div className="space-y-3 pt-2 border-t border-line/60">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="السعر الأصلي قبل الخصم (ج.م)"
                    type="number"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    placeholder="مثال: 35"
                    required={formHasOffer}
                  />
                  <Input
                    label="سعر العرض للبيع (ج.م)"
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="مثال: 25"
                    required
                  />
                </div>

                {/* Savings Live Preview */}
                {Number(formOriginalPrice) > Number(formPrice) && Number(formPrice) > 0 && (
                  <div className="flex items-center justify-between bg-accent-soft/50 border border-accent/30 rounded-xl px-3 py-2 text-xs font-body">
                    <span className="text-ink font-semibold">توفير الطالب المحسوب:</span>
                    <span className="font-bold text-accent font-mono font-mono-nums">
                      وفر {Number(formOriginalPrice) - Number(formPrice)} ج.م ({Math.round(((Number(formOriginalPrice) - Number(formPrice)) / Number(formOriginalPrice)) * 100)}%-)
                    </span>
                  </div>
                )}

                <Input
                  label="نص شارة العرض (اختياري)"
                  value={formOfferTag}
                  onChange={(e) => setFormOfferTag(e.target.value)}
                  placeholder="مثال: عرض خاص، كومبو التوفير، خصم 25%"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!formHasOffer && (
              <Input
                label="السعر (ج.م)"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            )}
            <div className={formHasOffer ? 'col-span-2' : ''}>
              <Input
                label="وقت التحضير (دقائق)"
                type="number"
                value={formPrepTime}
                onChange={(e) => setFormPrepTime(e.target.value)}
                required
              />
            </div>
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

      {/* Combo Deal Creation & Edit Modal */}
      <Modal
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        title={editingCombo ? 'تعديل عرض الكومبو' : 'إنشاء عرض / باقة كومبو جديدة'}
        description="اختر الأصناف المشمولة في العرض والكميات وحدد سعر البيع المخفض."
      >
        <form onSubmit={handleSaveCombo} className="space-y-4 text-right">
          {/* Combo Name */}
          <Input
            label="اسم العرض / الكومبو"
            value={comboName}
            onChange={(e) => setComboName(e.target.value)}
            placeholder="مثال: عرض الصحاب (2 بطاطس + كانز) أو كومبو التوفير"
            required
          />

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-body font-bold text-ink mb-1.5">
                التصنيف التابع له العرض
              </label>
              <select
                value={comboCategory}
                onChange={(e) => setComboCategory(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:border-accent"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bundle Items Picker */}
          <div className="bg-canvas border border-line/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-accent" />
                <p className="font-body font-bold text-xs text-ink">
                  الأصناف المشمولة في العرض ({selectedComboItems.length})
                </p>
              </div>
              <span className="text-[11px] font-body text-ink-soft">
                اختر صنفاً لإضافته للباقة
              </span>
            </div>

            {/* Select dropdown to add items */}
            <select
              defaultValue=""
              onChange={(e) => {
                handleAddItemToCombo(e.target.value);
                e.target.value = '';
              }}
              className="w-full bg-surface border border-line/80 rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="" disabled>
                + اختر صنفاً من المنيو لإضافته للعرض...
              </option>
              {kioskItems
                .filter((i) => !i.isCombo)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({formatEGP(i.price)})
                  </option>
                ))}
            </select>

            {/* Selected Items List with Quantity Controls */}
            {selectedComboItems.length > 0 ? (
              <div className="space-y-2 pt-1">
                {selectedComboItems.map((ci) => (
                  <div
                    key={ci.itemId}
                    className="flex items-center justify-between bg-surface border border-line/70 rounded-xl px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-bold text-ink truncate">{ci.name}</p>
                      <p className="font-mono text-[11px] text-ink-soft font-mono-nums">
                        {ci.price} ج.م × {ci.quantity} = {ci.price * ci.quantity} ج.م
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-canvas border border-line rounded-lg px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateComboItemQuantity(ci.itemId, ci.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-ink-soft hover:text-danger hover:bg-surface rounded transition-colors"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="font-mono text-xs font-bold text-ink w-4 text-center font-mono-nums">
                          {ci.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateComboItemQuantity(ci.itemId, ci.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-ink-soft hover:text-accent hover:bg-surface rounded transition-colors"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateComboItemQuantity(ci.itemId, 0)}
                        className="p-1 text-ink-soft hover:text-danger rounded-lg transition-colors"
                        title="حذف من الباقة"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Auto Calculated Original Price Summary */}
                <div className="flex items-center justify-between bg-surface border border-line/80 rounded-xl px-3 py-2 text-xs font-body">
                  <span className="text-ink-soft font-medium">إجمالي السعر الأصلي للأصناف:</span>
                  <span className="font-mono font-bold text-ink font-mono-nums">
                    {comboOriginalPrice} ج.م
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-[11px] font-body text-ink-soft py-3 bg-surface/50 border border-dashed border-line rounded-xl">
                لم يتم اختيار أصناف بعد. اختر الأصناف من القائمة أعلاه لتكوين العرض.
              </p>
            )}
          </div>

          {/* Pricing & Savings */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="سعر العرض للبيع (ج.م)"
              type="number"
              value={comboSellingPrice}
              onChange={(e) => setComboSellingPrice(e.target.value)}
              placeholder="مثال: 70"
              required
            />
            <Input
              label="وقت التحضير (دقائق)"
              type="number"
              value={comboPrepTime}
              onChange={(e) => setComboPrepTime(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Savings Banner */}
          {comboOriginalPrice > Number(comboSellingPrice) && Number(comboSellingPrice) > 0 && (
            <div className="flex items-center justify-between bg-accent-soft border border-accent/40 rounded-2xl px-4 py-2.5 text-xs font-body">
              <div className="flex items-center gap-1.5 text-ink font-semibold">
                <Percent className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>توفير الطالب في العرض:</span>
              </div>
              <span className="font-bold text-accent font-mono font-mono-nums text-sm">
                وفر {comboOriginalPrice - Number(comboSellingPrice)} ج.م (خصم {Math.round(((comboOriginalPrice - Number(comboSellingPrice)) / comboOriginalPrice) * 100)}%-)
              </span>
            </div>
          )}

          {/* Offer Tag Badge Input */}
          <Input
            label="نص شارة العرض (اختياري)"
            value={comboOfferTag}
            onChange={(e) => setComboOfferTag(e.target.value)}
            placeholder="مثال: كومبو التوفير، اشتري 2 بسعر خاص"
          />

          <div className="flex items-center gap-3 pt-3 border-t border-line/60">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || selectedComboItems.length === 0}
              className="flex-1"
            >
              {editingCombo ? 'حفظ تعديلات العرض' : 'إنشاء ونشر العرض'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsComboModalOpen(false)}
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
