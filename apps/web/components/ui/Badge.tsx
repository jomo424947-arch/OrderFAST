import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'danger' | 'neutral';
  className?: string;
  icon?: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'accent',
  className,
  icon,
}) => {
  const variants = {
    primary: 'bg-primary-soft text-primary-ink',
    accent: 'bg-accent-soft text-accent',
    danger: 'bg-danger-soft text-danger',
    neutral: 'bg-surface text-ink-soft border border-line',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold',
        variants[variant],
        className
      )}
    >
      {icon && <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
