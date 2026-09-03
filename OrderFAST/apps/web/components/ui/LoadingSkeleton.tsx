import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-line/50 rounded-xl',
            className
          )}
        />
      ))}
    </>
  );
};

export const KioskCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface border border-line/70 rounded-3xl overflow-hidden shadow-warm">
      <Skeleton className="w-full h-36 sm:h-40 rounded-none" />
      <div className="p-4 sm:p-5 pt-3 space-y-3">
        <div className="flex items-start justify-between -mt-9 relative z-10">
          <Skeleton className="w-14 h-14 rounded-2xl border-2 border-white" />
          <Skeleton className="w-12 h-6 rounded-xl mt-2" />
        </div>
        <Skeleton className="w-1/2 h-5 rounded-lg" />
        <Skeleton className="w-2/3 h-4 rounded-lg" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="w-16 h-5 rounded-md" />
          <Skeleton className="w-20 h-5 rounded-md" />
        </div>
        <div className="pt-3 border-t border-line/40 flex justify-between">
          <Skeleton className="w-24 h-3.5" />
          <Skeleton className="w-16 h-3.5" />
        </div>
      </div>
    </div>
  );
};
