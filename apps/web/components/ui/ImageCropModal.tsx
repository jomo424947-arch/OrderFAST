'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crop,
  Sliders,
} from 'lucide-react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  aspectRatio?: number; // width / height, default 16 / 9
  onClose: () => void;
  onConfirm: (blob: Blob, file: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  fileName = 'kiosk_cover.jpg',
  aspectRatio = 16 / 9,
  onClose,
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseScaleRef = useRef<number>(1);

  // Reset state when a new image source is supplied or modal opens
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setIsImageLoaded(false);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      loadedImageRef.current = img;
      setIsImageLoaded(true);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
    };

    img.onerror = () => {
      console.error('Failed to load image for cropping');
      setIsImageLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isOpen, imageSrc]);

  // Redraw canvas whenever zoom, offset, or image changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img || !isImageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear previous drawing
    ctx.clearRect(0, 0, w, h);

    // Background fill (dark slate)
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, w, h);

    // Calculate base scale to fill the crop area (cover fit)
    const scaleX = w / img.naturalWidth;
    const scaleY = h / img.naturalHeight;
    const baseScale = Math.max(scaleX, scaleY);
    baseScaleRef.current = baseScale;

    const effectiveScale = baseScale * zoom;

    // Draw the image centered with offset
    ctx.save();
    ctx.translate(w / 2 + offset.x, h / 2 + offset.y);
    ctx.scale(effectiveScale, effectiveScale);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    // Draw rule-of-thirds grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical rule lines
    ctx.beginPath();
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0);
    ctx.lineTo((w * 2) / 3, h);

    // Horizontal rule lines
    ctx.moveTo(0, h / 3);
    ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (h * 2) / 3);
    ctx.lineTo(w, (h * 2) / 3);
    ctx.stroke();

    // Border highlight
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.restore();
  }, [isImageLoaded, zoom, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle pointer / drag interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastOffsetRef.current = { ...offset };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: Math.round(lastOffsetRef.current.x + dx),
      y: Math.round(lastOffsetRef.current.y + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => {
      const next = Math.min(3.5, Math.max(0.8, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  // Directional Nudge handlers (step = 25px)
  const nudge = (dx: number, dy: number) => {
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  // Reset controls
  const handleReset = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  // Confirm and export cropped high-res canvas
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img || isProcessing) return;

    try {
      setIsProcessing(true);

      const exportWidth = 1200;
      const exportHeight = Math.round(1200 / aspectRatio); // 675 for 16:9

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;

      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('تعذر تجهيز مساحة القص');

      const scaleFactor = exportWidth / canvas.width;

      // Dark background fill
      exportCtx.fillStyle = '#1c1917';
      exportCtx.fillRect(0, 0, exportWidth, exportHeight);

      // Render transformed image
      exportCtx.save();
      exportCtx.translate(
        exportWidth / 2 + offset.x * scaleFactor,
        exportHeight / 2 + offset.y * scaleFactor
      );
      const effectiveScale = baseScaleRef.current * zoom * scaleFactor;
      exportCtx.scale(effectiveScale, effectiveScale);
      exportCtx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      );
      exportCtx.restore();

      exportCanvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (!blob) {
            console.error('Failed to create cropped image blob');
            return;
          }

          const baseName = fileName.replace(/\.[^/.]+$/, '');
          const croppedFile = new File([blob], `${baseName}_cropped.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          onConfirm(blob, croppedFile);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error during image crop confirmation:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div className="bg-surface border border-line rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between text-right">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 id="crop-modal-title" className="font-display font-bold text-base sm:text-lg text-ink">
                تعديل وضبط صورة غلاف الكشك
              </h3>
              <p className="font-body text-xs text-ink-soft">
                اسحب الصورة للتحريك أو استخدم خيارات التكبير والتصغير للحصول على الكادر المثالي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-canvas hover:bg-stone-200 text-ink-soft hover:text-ink flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Canvas Viewport */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Canvas Viewport Container */}
          <div
            ref={containerRef}
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-stone-900 border border-stone-700 shadow-inner flex items-center justify-center select-none"
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className={`w-full h-full object-contain ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
              title="انقر واسحب لتحريك الصورة، أو استخدم عجلة الفأرة للتكبير والتصغير"
            />

            {/* Hint overlay badge */}
            <div className="absolute top-2.5 right-2.5 pointer-events-none bg-black/65 backdrop-blur-xs text-white/90 px-2.5 py-1 rounded-full text-[11px] font-body flex items-center gap-1.5 shadow-xs">
              <Move className="w-3 h-3 text-amber-400" />
              <span>اسحب للتحريك</span>
            </div>

            {/* Ratio badge */}
            <div className="absolute bottom-2.5 right-2.5 pointer-events-none bg-black/65 backdrop-blur-xs text-white/80 px-2 py-0.5 rounded-md text-[10px] font-mono">
              16:9
            </div>
          </div>

          {/* Adjustment Controls Section */}
          <div className="bg-canvas border border-line/80 rounded-2xl p-3.5 space-y-3">
            {/* Zoom Slider Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5 whitespace-nowrap min-w-[70px]">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                <span>التقريب:</span>
              </span>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                className="w-7 h-7 rounded-xl bg-surface border border-line hover:border-accent text-ink flex items-center justify-center transition-colors"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-stone-300 rounded-lg"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                className="w-7 h-7 rounded-xl bg-surface border border-line hover:border-accent text-ink flex items-center justify-center transition-colors"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-xs font-bold text-primary-ink min-w-[40px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-line hover:border-primary text-ink-soft hover:text-ink text-xs transition-colors"
                title="إعادة ضبط الصورة لوضعها الافتراضي"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-soft" />
                <span className="hidden sm:inline">إعادة ضبط</span>
              </button>
            </div>

            {/* Directional Nudge Pad (يمين / يسار / فوق / تحت) */}
            <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-body text-ink-soft flex items-center gap-1">
                <span>تحريك دقيق للكادر:</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => nudge(25, 0)}
                  className="px-2.5 py-1 rounded-xl bg-surface border border-line hover:border-accent text-ink text-xs font-body font-medium flex items-center gap-1 transition-colors active:scale-95"
                  title="تحريك لليمين"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-accent" />
                  <span>يمين</span>
                </button>

                <button
                  type="button"
                  onClick={() => nudge(-25, 0)}
                  className="px-2.5 py-1 rounded-xl bg-surface border border-line hover:border-accent text-ink text-xs font-body font-medium flex items-center gap-1 transition-colors active:scale-95"
                  title="تحريك لليسار"
                >
                  <span>شمال</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-accent" />
                </button>

                <button
                  type="button"
                  onClick={() => nudge(0, 25)}
                  className="px-2.5 py-1 rounded-xl bg-surface border border-line hover:border-accent text-ink text-xs font-body font-medium flex items-center gap-1 transition-colors active:scale-95"
                  title="تحريك للأسفل"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-accent" />
                  <span>تحت</span>
                </button>

                <button
                  type="button"
                  onClick={() => nudge(0, -25)}
                  className="px-2.5 py-1 rounded-xl bg-surface border border-line hover:border-accent text-ink text-xs font-body font-medium flex items-center gap-1 transition-colors active:scale-95"
                  title="تحريك للأعلى"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-accent" />
                  <span>فوق</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-line bg-canvas/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-2xl bg-surface border border-line hover:border-stone-400 text-ink text-xs font-body font-bold transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !isImageLoaded}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink font-body font-bold text-xs sm:text-sm shadow-warm transition-all disabled:opacity-50 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'جاري معالجة وقص الصورة...' : 'تأكيد وقص الصورة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
