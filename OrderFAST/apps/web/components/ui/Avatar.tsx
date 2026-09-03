import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className,
}) => {
  // Extract initials (e.g. "أحمد كريم" -> "أ.ك")
  const getInitials = (text: string) => {
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}.${parts[1][0]}`;
    }
    return text.slice(0, 2);
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs font-bold rounded-full',
    md: 'w-10 h-10 text-sm font-bold rounded-full',
    lg: 'w-16 h-16 text-xl font-bold rounded-full',
    xl: 'w-20 h-20 text-2xl font-bold rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-primary-soft text-primary-ink font-display flex items-center justify-center border border-primary/20 select-none flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
