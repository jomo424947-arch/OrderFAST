import React, { ReactNode } from 'react';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface/50 border border-dashed border-line rounded-3xl my-6">
      <div className="w-16 h-16 rounded-2xl bg-canvas border border-line flex items-center justify-center text-ink-soft mb-4">
        {icon || <PackageOpen className="w-8 h-8 stroke-[1.5]" />}
      </div>
      <h4 className="font-display font-bold text-lg text-ink mb-1.5">{title}</h4>
      {description && (
        <p className="font-body text-xs sm:text-sm text-ink-soft max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
