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
    <div className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Skeleton className="w-14 h-5 rounded-full" />
        <Skeleton className="w-10 h-3" />
      </div>
    </div>
  );
};
