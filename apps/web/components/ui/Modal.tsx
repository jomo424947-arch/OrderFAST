import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-surface border border-line rounded-3xl shadow-floating z-10 text-right animate-in fade-in zoom-in-95 duration-200 my-auto overflow-hidden',
          maxWidths[maxWidth]
        )}
      >
        {/* Modal Header */}
        {title || description ? (
          <div className="px-5 sm:px-6 pt-5 pb-3.5 border-b border-line/60 shrink-0 relative pr-12">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-2 text-ink-soft hover:text-ink rounded-full hover:bg-line/40 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {title && (
              <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
                {title}
              </h3>
            )}
            {description && (
              <p className="font-body text-xs text-ink-soft mt-1">
                {description}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-ink-soft hover:text-ink rounded-full hover:bg-line/40 transition-colors z-20 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
