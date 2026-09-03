'use client';

import React, { useState } from 'react';
import { Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOrderStore } from '@/stores/useOrderStore';
import { cn } from '@/lib/utils';

interface OrderRatingCardProps {
  orderId: string;
  kioskName: string;
  existingRating?: number | null;
  onRated?: (rating: number) => void;
}

export const OrderRatingCard: React.FC<OrderRatingCardProps> = ({
  orderId,
  kioskName,
  existingRating,
  onRated,
}) => {
  const { rateOrder } = useOrderStore();
  const [selectedRating, setSelectedRating] = useState<number>(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(existingRating));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const starLabels: Record<number, string> = {
    1: 'سيء',
    2: 'مقبول',
    3: 'جيد',
    4: 'جيد جداً',
    5: 'ممتاز ⭐',
  };

  const activeRating = hoveredRating || selectedRating;

  const handleSubmit = async () => {
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await rateOrder(orderId, selectedRating);
      setIsSubmitted(true);
      onRated?.(selectedRating);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال التقييم. حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already rated (either from props or just submitted)
  if (isSubmitted || existingRating) {
    const finalRating = existingRating || selectedRating;
    return (
      <div className="bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 border border-amber-300/60 rounded-3xl p-5 shadow-warm text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 mb-1 shadow-sm">
          <Sparkles className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-display font-black text-base text-ink flex items-center justify-center gap-1.5">
            <span>شكراً لتقييمك!</span>
            <CheckCircle2 className="w-4 h-4 text-accent" />
          </h4>
          <p className="font-body text-xs text-ink-soft">
            تم تسجيل تقييمك لكشك <strong className="text-ink font-semibold">{kioskName}</strong> بنجاح
          </p>
        </div>

        {/* Display Submitted Stars */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-6 h-6 transition-all',
                star <= finalRating
                  ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-sm'
                  : 'text-stone-300 fill-transparent'
              )}
            />
          ))}
        </div>

        <p className="text-[11px] font-body text-amber-800 font-bold bg-amber-100/70 py-1 px-3 rounded-full inline-block">
          {finalRating} من 5 {starLabels[finalRating] ? `(${starLabels[finalRating]})` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-ticket space-y-4 text-center transition-all animate-in slide-in-from-bottom-3 duration-400">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>تقييم الكشك بالنجوم</span>
        </div>
        <h4 className="font-display font-black text-base sm:text-lg text-ink">
          كيف كانت تجربتك مع {kioskName}؟
        </h4>
        <p className="font-body text-xs text-ink-soft">
          اختر عدد النجوم لتقييم الخدمة وجودة الطلب
        </p>
      </div>

      {/* 5 Interactive Golden Stars */}
      <div className="flex items-center justify-center gap-2 py-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 hover:scale-125 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label={`${star} من 5 نجوم`}
            >
              <Star
                className={cn(
                  'w-8 h-8 sm:w-9 sm:h-9 transition-colors duration-200',
                  isFilled
                    ? 'fill-amber-400 text-amber-500 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
                    : 'text-stone-300 fill-stone-100 hover:text-amber-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Label of current selected / hovered rating */}
      <div className="h-6 flex items-center justify-center">
        {activeRating > 0 ? (
          <span className="font-display font-bold text-sm text-amber-800 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200/80 animate-in fade-in duration-200">
            {activeRating} نجوم · {starLabels[activeRating]}
          </span>
        ) : (
          <span className="text-xs font-body text-ink-soft/70">
            اضغط على النجوم للتقييم
          </span>
        )}
      </div>

      {errorMessage && (
        <p className="text-xs font-body text-danger font-medium">
          {errorMessage}
        </p>
      )}

      {/* Submit Button */}
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={handleSubmit}
        disabled={selectedRating === 0 || isSubmitting}
        isLoading={isSubmitting}
        className={cn(
          'w-full shadow-md font-bold text-sm py-2.5 transition-all',
          selectedRating > 0
            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/50'
            : 'opacity-60'
        )}
      >
        <Star className="w-4 h-4 fill-white text-white ml-1.5" />
        <span>
          {selectedRating > 0
            ? `إرسال تقييم ${selectedRating} ${selectedRating === 1 ? 'نجمة' : 'نجوم'}`
            : 'حدد التقييم بالنجوم'}
        </span>
      </Button>
    </div>
  );
};
