import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-body font-bold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-primary text-primary-ink hover:bg-primary-hover shadow-sm',
      secondary:
        'bg-primary-soft text-primary-ink hover:bg-primary-soft/80',
      accent:
        'bg-accent text-white hover:bg-accent-hover shadow-sm',
      ghost:
        'bg-transparent border-[1.5px] border-line text-ink hover:bg-surface hover:border-ink/20',
      outline:
        'bg-surface border border-line text-ink hover:border-primary/50 hover:bg-primary-soft/20',
      danger:
        'bg-transparent border-[1.5px] border-danger text-danger hover:bg-danger-soft',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
      md: 'px-4 py-3 text-sm rounded-2xl gap-2',
      lg: 'px-6 py-4 text-base rounded-2xl gap-2.5 w-full',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
