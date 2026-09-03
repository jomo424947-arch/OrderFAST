import React, { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className,
  value,
  onChange,
  onClear,
  placeholder = "دور على كشك أو صنف",
  ...props
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/75 pointer-events-none">
        <Search className="w-4 h-4 stroke-[2.2]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full bg-surface border-[1.5px] border-line rounded-xl pr-10 pl-10 py-2.5 font-body text-xs sm:text-sm text-ink placeholder:text-ink/55 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 shadow-sm',
          className
        )}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1 rounded-full hover:bg-line/40 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
