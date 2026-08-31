import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "حصل خطأ غير متوقع",
  message = "تعذر تحميل البيانات المطلوبة، برجاء المحاولة مرة أخرى.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-danger-soft/40 border border-danger/20 rounded-3xl my-6">
      <div className="w-14 h-14 rounded-2xl bg-danger-soft flex items-center justify-center text-danger mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="font-display font-bold text-lg text-danger mb-1.5">{title}</h4>
      <p className="font-body text-xs sm:text-sm text-ink-soft max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 ml-1" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
};
