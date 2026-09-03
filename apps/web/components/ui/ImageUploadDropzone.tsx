'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

export interface ImageUploadDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  onChange,
  onClear,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('الملف المختار يجب أن يكون صورة صالحة (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الصورة');
      }

      onChange(data.url);
    } catch (err: any) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  return (
    <div className="space-y-3 text-right">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Upload Zone / Preview Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative h-44 w-full rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 select-none ${
          isDragging
            ? 'border-primary bg-primary-soft/40 scale-[1.01]'
            : value
            ? 'border-line hover:border-primary/60 bg-surface'
            : 'border-line/80 hover:border-primary/70 bg-canvas hover:bg-surface'
        }`}
      >
        {value ? (
          <>
            {/* Uploaded Image Preview */}
            <Image
              src={value}
              alt="معاينة صورة الكشك"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex flex-col items-center justify-center text-white gap-2 opacity-0 hover:opacity-100 duration-200">
              <Upload className="w-6 h-6" />
              <span className="text-xs font-body font-bold">
                انقر لاختيار صورة أخرى أو اسحب ملفاً هنا
              </span>
            </div>
          </>
        ) : (
          <div className="text-center space-y-2 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-line flex items-center justify-center mx-auto text-primary-ink shadow-xs">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-accent" />
              )}
            </div>
            <div>
              <p className="font-body text-xs sm:text-sm font-bold text-ink">
                اضغط لاختيار صورة من جهازك
              </p>
              <p className="font-body text-[11px] text-ink-soft mt-0.5">
                أو اسحب وأفلت ملف الصورة هنا (PNG, JPG حتى 5 ميجابايت)
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="font-body text-xs font-bold text-ink">
              جاري رفع الصورة إلى السحابة...
            </p>
          </div>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <p className="font-body text-xs text-danger bg-danger-soft border border-danger/20 p-2.5 rounded-xl">
          {uploadError}
        </p>
      )}

      {/* Action buttons if image exists */}
      {value && (
        <div className="flex items-center justify-between text-xs pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-1.5 text-accent font-bold hover:underline"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>رفع صورة بديلة من جهازك</span>
          </button>

          {onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="inline-flex items-center gap-1 text-danger hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الصورة واستعادة الافتراضي</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
