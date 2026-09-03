import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kiosk } from '@/types';
import {
  Store,
  Clock,
  MapPin,
  Star,
  Coffee,
  Utensils,
  ArrowLeft,
  Users,
  Zap,
  Tag,
  Sparkles,
} from 'lucide-react';
import { formatWaitTime } from '@/lib/formatters';

export interface KioskCardProps {
  kiosk: Kiosk;
}

const DEFAULT_COVERS: Record<string, string> = {
  coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
  food: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&auto=format&fit=crop&q=80',
  sweets: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
};

function getKioskCover(kiosk: Kiosk): string {
  if (kiosk.imageUrl && kiosk.imageUrl.trim().length > 0) {
    return kiosk.imageUrl;
  }
  const cat = (kiosk.category || '').toLowerCase();
  const name = (kiosk.name || '').toLowerCase();

  if (
    cat.includes('قهوة') ||
    cat.includes('كافيه') ||
    name.includes('كافيه') ||
    cat.includes('مشروبات ساخنة')
  ) {
    return DEFAULT_COVERS.coffee;
  }
  if (cat.includes('عصائر') || cat.includes('باردة') || cat.includes('مشروبات')) {
    return DEFAULT_COVERS.drinks;
  }
  if (
    cat.includes('ساندوتش') ||
    cat.includes('وجبات') ||
    cat.includes('سناكس') ||
    cat.includes('برجر')
  ) {
    return DEFAULT_COVERS.food;
  }
  if (cat.includes('حلويات') || cat.includes('كريب') || cat.includes('وافل')) {
    return DEFAULT_COVERS.sweets;
  }
  return DEFAULT_COVERS.default;
}

function getKioskIcon(kiosk: Kiosk) {
  const cat = (kiosk.category || '').toLowerCase();
  const name = (kiosk.name || '').toLowerCase();

  if (
    cat.includes('قهوة') ||
    cat.includes('كافيه') ||
    name.includes('كافيه') ||
    cat.includes('مشروبات')
  ) {
    return <Coffee className="w-6 h-6 text-amber-600" />;
  }
  if (
    cat.includes('ساندوتش') ||
    cat.includes('وجبات') ||
    cat.includes('سناكس') ||
    cat.includes('أكل') ||
    cat.includes('كريب')
  ) {
    return <Utensils className="w-6 h-6 text-primary" />;
  }
  return <Store className="w-6 h-6 text-accent" />;
}

export const KioskCard: React.FC<KioskCardProps> = React.memo(({ kiosk }) => {
  const [imageError, setImageError] = useState(false);
  const coverUrl = getKioskCover(kiosk);
  const ratingValue =
    kiosk.rating !== undefined && kiosk.rating !== null
      ? Number(kiosk.rating).toFixed(1)
      : '5.0';

  return (
    <Link
      href={`/student/kiosks/${kiosk.id}`}
      className="group block bg-surface rounded-3xl border border-line/70 hover:border-primary/40 transition-all duration-300 shadow-warm hover:shadow-ticket overflow-hidden cursor-pointer select-none"
    >
      {/* Cover Banner with Overlay Badges */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-gradient-to-br from-amber-100/70 via-stone-200 to-amber-50">
        {!imageError ? (
          <Image
            src={coverUrl}
            alt={kiosk.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-amber-200/40 to-stone-200 text-ink-soft">
            <Store className="w-12 h-12 opacity-30" />
          </div>
        )}

        {/* Gradient Shadow for High-Contrast Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15 pointer-events-none" />

        {/* Top Badges Row */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {/* Status Badge with Glowing Indicator */}
          {kiosk.isOpen ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>مفتوح الآن</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-900/80 text-stone-300 border border-stone-700/60 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-stone-400" />
              <span>مغلق حالياً</span>
            </div>
          )}

          {/* Wait Time Pill */}
          {kiosk.isOpen && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white border border-white/20 backdrop-blur-md shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{formatWaitTime(kiosk.estimatedWaitMins)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 pt-2">
        {/* Floating Avatar */}
        <div className="flex items-center justify-between -mt-9 relative z-10 mb-2.5">
          <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            {getKioskIcon(kiosk)}
          </div>
        </div>

        {/* Kiosk Name & Rating Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-base sm:text-lg text-ink group-hover:text-primary transition-colors truncate">
            {kiosk.name}
          </h3>

          {Boolean(kiosk.ratingCount && kiosk.ratingCount > 0 && Number(kiosk.rating) > 0) ? (
            <div
              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-800 flex-shrink-0"
              title={`${kiosk.ratingCount} تقييم`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-mono">{ratingValue}</span>
              <span className="text-[10px] text-amber-700/80 font-mono font-normal mr-0.5">
                ({kiosk.ratingCount})
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-xs font-bold text-emerald-800 flex-shrink-0 shadow-sm"
              title="كشك جديد - لم يحصل على تقييمات بعد"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-200" />
              <span>جديد</span>
            </div>
          )}
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-1.5 text-xs text-ink-soft font-medium mt-1">
          <MapPin className="w-3.5 h-3.5 text-accent stroke-[2.2] flex-shrink-0" />
          <span className="truncate">{kiosk.collegeLocation}</span>
          {kiosk.campusZone && (
            <>
              <span className="text-line">•</span>
              <span className="truncate">{kiosk.campusZone}</span>
            </>
          )}
        </div>

        {/* Meta Badges / Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {kiosk.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-body font-semibold bg-canvas border border-line text-ink">
              <Tag className="w-3 h-3 text-ink/75 stroke-[2]" />
              <span>{kiosk.category}</span>
            </span>
          )}

          {kiosk.ordersAheadCount !== undefined && kiosk.ordersAheadCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-body font-semibold bg-primary-soft text-primary-ink border border-primary/20">
              <Users className="w-3 h-3 text-primary-ink stroke-[2]" />
              <span>{kiosk.ordersAheadCount} طلبات بالانتظار</span>
            </span>
          )}

          {kiosk.acceptsOnlineOrders && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-body font-semibold bg-accent-soft text-accent border border-accent/30">
              <Zap className="w-3 h-3 text-accent stroke-[2.2]" />
              <span>طلب مسبق متاح</span>
            </span>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-3.5 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
          <span className="text-ink-soft text-[11px] font-medium">
            {kiosk.openingHours || 'مواعيد العمل الجامعية'}
          </span>

          <div className="inline-flex items-center gap-1 font-bold text-accent group-hover:text-primary transition-colors">
            <span>تصفح المنيو</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
});

