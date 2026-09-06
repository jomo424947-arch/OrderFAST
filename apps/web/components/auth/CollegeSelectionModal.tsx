'use client';

import React, { useState } from 'react';
import { COLLEGES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Sparkles } from 'lucide-react';

interface CollegeSelectionModalProps {
  isOpen: boolean;
  studentName?: string;
  onSelectCollege: (college: string) => Promise<void>;
}

export function CollegeSelectionModal({
  isOpen,
  studentName,
  onSelectCollege,
}: CollegeSelectionModalProps) {
  const [selectedCollege, setSelectedCollege] = useState<string>(COLLEGES[0]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSelectCollege(selectedCollege);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-line rounded-3xl p-6 shadow-floating text-right space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-sm">
          <GraduationCap className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-soft text-primary-ink text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خطوة أخيرة لإكمال حسابك</span>
          </div>
          <h3 className="font-display font-bold text-xl text-ink">
            {studentName ? `أهلاً بك، ${studentName}!` : 'أهلاً بك في FastOrder!'}
          </h3>
          <p className="font-body text-xs text-ink-soft">
            يرجى تحديد كليتك لعرض الأكشاك والعروض الأقرب إليك أولاً
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block font-body text-xs font-semibold text-ink mb-1.5">
              اختر الكلية:
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-xs sm:text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {COLLEGES.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            تأكيد والبدء الآن
          </Button>
        </form>
      </div>
    </div>
  );
}
