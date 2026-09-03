import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'segment' | 'chips';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'segment',
}) => {
  if (variant === 'chips') {
    return (
      <div className={cn('flex gap-2 overflow-x-auto no-scrollbar py-1', className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex-shrink-0 font-body text-xs sm:text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 select-none whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-ink border-primary shadow-sm'
                  : 'bg-surface text-ink-soft border-line hover:border-ink/20 hover:text-ink'
              )}
            >
              {tab.icon && <span className="ml-1.5 inline-block">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn('mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono', isActive ? 'bg-primary-ink/10 text-primary-ink' : 'bg-line/60 text-ink-soft')}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex bg-surface border border-line/60 rounded-xl p-1 shadow-sm select-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-body font-semibold rounded-lg transition-all duration-200 whitespace-nowrap',
              isActive
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-white/40'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[11px] font-mono rounded-full',
                  isActive ? 'bg-primary-soft text-primary-ink font-bold' : 'bg-line/40 text-ink-soft'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
