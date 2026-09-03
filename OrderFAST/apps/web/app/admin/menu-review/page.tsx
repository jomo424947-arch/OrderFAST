'use client';

import React, { useState, useEffect } from 'react';
import { useKioskStore } from '@/stores/useKioskStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/formatters';
import {
  CheckCircle2,
  XCircle,
  Coffee,
  Utensils,
  Clock,
  Store,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

export default function AdminMenuReviewPage() {
  const {
    menuItems,
    kiosks,
    categories,
    fetchUnderReviewItems,
    fetchKiosks,
    approveMenuItem,
    rejectMenuItem,
  } = useKioskStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchKiosks();
    fetchUnderReviewItems();
  }, [fetchKiosks, fetchUnderReviewItems]);

  const underReviewItems = menuItems.filter((i) => i.isUnderReview);

  const handleApprove = (itemId: string, name: string) => {
    approveMenuItem(itemId);
    setToastMessage(`تم اعتماد صنف "${name}" وأصبح متاحاً للطلب في التطبيق.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReject = (itemId: string, name: string) => {
    if (confirm(`هل أنت متأكد من رفض وحذف صنف "${name}"؟`)) {
      rejectMenuItem(itemId);
      setToastMessage(`تم رفض صنف "${name}" وإزالته.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleApproveAll = () => {
    underReviewItems.forEach((item) => approveMenuItem(item.id));
    setToastMessage('تم اعتماد جميع الأصناف قيد المراجعة بنجاح.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            اعتماد ومراجعة أصناف المنيو
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {underReviewItems.length} صنف بانتظار الموافقة ليظهر للطلاب في كليتهم
          </p>
        </div>

        {underReviewItems.length > 1 && (
          <Button variant="primary" size="sm" onClick={handleApproveAll}>
            <CheckCircle2 className="w-4 h-4 ml-1.5" />
            <span>اعتماد الكل دفعة واحدة</span>
          </Button>
        )}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {underReviewItems.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-8 h-8 text-accent" />}
          title="لا توجد أصناف قيد المراجعة حالياً"
          description="جميع أصناف المنيو في كافة الأكشاك معتمدة وجاهزة للطلب من قبل الطلاب."
        />
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {underReviewItems.map((item) => {
            const kiosk = kiosks.find((k) => k.id === item.kioskId);
            const kioskName = kiosk?.name || (item as any).kioskName || 'كشك مخصص';
            const collegeLocation = kiosk?.collegeLocation || (item as any).collegeLocation || 'الجامعة';
            const category = categories.find((c) => c.id === item.categoryId);
            const categoryName = category?.name || (item as any).categoryName;

            return (
              <div
                key={item.id}
                className="bg-surface border border-primary/30 rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Kiosk Tag */}
                  <div className="flex items-center justify-between pb-3 border-b border-line/60">
                    <div className="flex items-center gap-2 text-xs font-body text-ink-soft">
                      <Store className="w-3.5 h-3.5 text-accent" />
                      <span className="font-bold text-ink">{kioskName}</span>
                      <span>({collegeLocation})</span>
                    </div>

                    <span className="bg-primary-soft text-primary-ink text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full">
                      قيد المراجعة
                    </span>
                  </div>

                  {/* Item Content */}
                  <div className="flex items-start gap-3.5 mt-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-canvas border border-line flex items-center justify-center text-primary-ink flex-shrink-0">
                      {item.categoryId?.includes('drink') ? (
                        <Coffee className="w-6 h-6 stroke-[1.5]" />
                      ) : (
                        <Utensils className="w-6 h-6 stroke-[1.5]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-base text-ink">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="font-body text-xs text-ink-soft mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs font-body">
                        <span className="font-mono font-bold text-ink">
                          {formatEGP(item.price)}
                        </span>
                        <span className="text-line">•</span>
                        <span className="text-ink-soft flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.preparationTimeMins || 5} دقائق تحضير</span>
                        </span>
                        {category && (
                          <>
                            <span className="text-line">•</span>
                            <span className="text-ink-soft">{category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions: Approve / Reject */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-line/60">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleApprove(item.id, item.name)}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    <span>اعتماد الصنف</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger-soft hover:text-danger flex-1"
                    onClick={() => handleReject(item.id, item.name)}
                  >
                    <XCircle className="w-4 h-4 ml-1.5" />
                    <span>رفض وإلغاء</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
