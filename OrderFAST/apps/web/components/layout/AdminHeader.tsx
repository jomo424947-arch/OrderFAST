'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheck } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const { admin } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Mobile Title & Admin Identity */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <p className="font-display font-bold text-base text-ink">{admin?.name || 'مدير النظام'}</p>
          <p className="text-[10px] font-body text-ink-soft">لوحة الإدارة المركزية</p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-body text-ink-soft">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>منصة التحكم المركزية — جامعة سفنكس</span>
        </div>
      </div>

      {/* Admin Profile Display */}
      <div className="flex items-center gap-3">
        <div className="text-left hidden sm:block">
          <p className="font-body font-bold text-xs text-ink">{admin?.name || 'مدير النظام'}</p>
          <p className="font-body text-[10px] text-ink-soft">{admin?.email || 'admin@sphinx.edu.eg'}</p>
        </div>
        <Avatar name={admin?.name || 'مدير'} size="sm" />
      </div>
    </header>
  );
};
