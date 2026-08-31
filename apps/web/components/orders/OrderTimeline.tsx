import React from 'react';
import { OrderStatus } from '@/types';
import { Check, Clock, PackageCheck, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrderTimelineProps {
  status: OrderStatus;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  const steps = [
    { id: 'placed', label: 'تم استلام الأوردر' },
    { id: 'pending_review', label: 'في انتظار موافقة الكشك' },
    { id: 'accepted', label: 'تم قبول الأوردر' },
    { id: 'preparing', label: 'جاري التجهيز' },
    { id: 'ready_for_pickup', label: 'جاهز للاستلام' },
    { id: 'picked_up', label: 'تم الاستلام' },
  ];

  const getStepIndex = (currentStatus: OrderStatus): number => {
    switch (currentStatus) {
      case 'placed':
        return 0;
      case 'pending_review':
        return 1;
      case 'accepted':
        return 2;
      case 'preparing':
        return 3;
      case 'ready_for_pickup':
        return 4;
      case 'picked_up':
        return 5;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(status);

  if (status === 'rejected') {
    return (
      <div className="bg-danger-soft/60 border border-danger/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center flex-shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-body font-bold text-sm text-danger">تم رفض الأوردر</h4>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            نعتذر، الكشك غير قادر على تحضير الأوردر حالياً.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'no_show') {
    return (
      <div className="bg-danger-soft/60 border border-danger/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-body font-bold text-sm text-danger">لم يتم الحضور للاستلام</h4>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            تم تسجيل عدم الحضور على حسابك. برجاء الاستلام في المرات القادمة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <h4 className="font-body font-bold text-sm text-ink mb-3">
        حالة الأوردر المباشرة
      </h4>
      <div className="relative pr-6 space-y-6">
        {/* Continuous vertical line behind steps */}
        <div className="absolute right-[11px] top-2 bottom-2 w-[2px] bg-line" />

        {steps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <div key={step.id} className="relative flex items-center gap-3">
              {/* Step indicator circle */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold z-10 transition-all duration-300',
                  isCompleted
                    ? 'bg-accent text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-ink ring-4 ring-primary/20 scale-110'
                    : 'bg-canvas border-2 border-line text-ink-soft'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-primary-ink animate-ping" />
                ) : (
                  <span className="text-[10px]">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-body text-xs sm:text-sm transition-colors',
                    isCurrent
                      ? 'font-bold text-ink'
                      : isCompleted
                      ? 'font-semibold text-ink-soft'
                      : 'text-ink-soft/60'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
