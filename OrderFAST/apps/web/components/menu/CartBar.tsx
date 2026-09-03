import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { formatEGP } from '@/lib/formatters';

export interface CartBarProps {
  itemCount: number;
  totalAmount: number;
  href?: string;
}

export const CartBar: React.FC<CartBarProps> = ({
  itemCount,
  totalAmount,
  href = '/student/cart',
}) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <Link
        href={href}
        className="flex items-center justify-between bg-primary hover:bg-primary-hover text-primary-ink px-5 py-3.5 rounded-2xl shadow-floating transition-all duration-200 active:scale-[0.99] font-body font-bold text-sm select-none"
      >
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          <span>عرض السلة · {itemCount} أصناف</span>
        </div>
        <span className="font-mono text-base font-black">
          {formatEGP(totalAmount)}
        </span>
      </Link>
    </div>
  );
};
