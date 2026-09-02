import React from 'react';
import { MenuItem } from '@/types';
import { formatEGP } from '@/lib/formatters';
import { Plus, Coffee, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItemRowProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  disabled?: boolean;
}

export const MenuItemRow: React.FC<MenuItemRowProps> = React.memo(({
  item,
  onAdd,
  disabled = false,
}) => {
  const isAvailable = item.isAvailable && !disabled;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 border-b border-line/70 last:border-0 transition-opacity',
        !isAvailable && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Placeholder thumbnail */}
        <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-ink-soft flex-shrink-0">
          {item.categoryId.includes('drink') ? (
            <Coffee className="w-5 h-5 stroke-[1.5]" />
          ) : (
            <Utensils className="w-5 h-5 stroke-[1.5]" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-body font-bold text-sm text-ink truncate">
              {item.name}
            </h5>
            {item.isUnderReview && (
              <span className="bg-primary-soft text-primary-ink text-[10px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                قيد المراجعة
              </span>
            )}
          </div>
          {isAvailable ? (
            <p className="font-mono text-xs text-ink-soft font-semibold mt-0.5">
              {formatEGP(item.price)}
            </p>
          ) : (
            <p className="font-body text-xs text-ink-soft font-semibold mt-0.5">
              غير متاح دلوقتي
            </p>
          )}
        </div>
      </div>

      {/* Add Button */}
      {isAvailable ? (
        <button
          type="button"
          onClick={() => onAdd(item)}
          className="w-8 h-8 rounded-full bg-primary-soft hover:bg-primary text-primary-ink flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
          aria-label={`إضافة ${item.name} للسلة`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      ) : (
        <span className="text-[11px] font-body text-ink-soft bg-canvas px-2.5 py-1 rounded-lg border border-line/60">
          نفد
        </span>
      )}
    </div>
  );
});
