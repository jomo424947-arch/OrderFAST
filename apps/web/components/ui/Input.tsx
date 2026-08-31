import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full text-right">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-body text-xs font-medium text-ink-soft mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={cn(
              'w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-3 font-body text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200',
              icon && (iconPosition === 'left' ? 'pl-11' : 'pr-11'),
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className
            )}
            {...props}
          />
          {icon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none flex items-center justify-center',
                iconPosition === 'left' ? 'left-3.5' : 'right-3.5'
              )}
            >
              {icon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-danger font-body">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-ink-soft font-body">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
