'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SupportFeedbackView } from '@/components/student/SupportFeedbackView';

export const StudentSupportPopIcon: React.FC = () => {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  // Check if dismissed previously in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissedUntil = localStorage.getItem('orderfast_support_popicon_dismissed');
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setIsDismissed(false);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    // Dismiss for 7 days
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('orderfast_support_popicon_dismissed', String(nextWeek));
  };

  // Do not show the floating pop icon if the user is already on the support or feedback page
  if (pathname.startsWith('/student/feedback') || pathname.startsWith('/support')) {
    return null;
  }

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Circular Pop Icon - Positioned on Bottom Right */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="relative group flex items-center justify-center">
          {/* Dismiss Mini-Button (X) */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-surface border border-line text-ink-soft hover:text-ink hover:bg-canvas shadow-xs flex items-center justify-center transition-all z-10 hover:scale-110 active:scale-95 opacity-70 group-hover:opacity-100"
            aria-label="إغلاق الأيقونة"
            title="إغلاق الأيقونة"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Main Circular Pop Icon */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-surface border-2 border-primary/40 hover:border-primary shadow-[0_8px_25px_rgba(255,90,31,0.22)] hover:shadow-[0_8px_30px_rgba(255,90,31,0.38)] flex items-center justify-center text-primary transition-all duration-200 active:scale-90 group focus:outline-none"
            aria-label="الشكاوى والمقترحات"
            title="الشكاوى والمقترحات"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />

            {/* Subtle live indicator pulse dot */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface animate-pulse" />
          </button>

          {/* Desktop Hover Label */}
          <div className="hidden sm:group-hover:flex absolute right-16 top-1/2 -translate-y-1/2 bg-surface/95 backdrop-blur-md border border-line px-3 py-1.5 rounded-xl shadow-warm whitespace-nowrap text-xs font-body font-bold text-ink pointer-events-none transition-all duration-150 animate-in fade-in slide-in-from-right-1">
            الشكاوى والمقترحات
          </div>
        </div>
      </div>

      {/* Pop-up Support Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="lg"
      >
        <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <SupportFeedbackView isEmbedded={true} />
        </div>
      </Modal>
    </>
  );
};
