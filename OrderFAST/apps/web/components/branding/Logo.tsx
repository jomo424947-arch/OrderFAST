import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'badge' | 'compact';
  theme?: 'light' | 'dark';
  className?: string;
  href?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'light',
  className = '',
  href = '/',
  showTagline = true,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#241F1A';
  const orangePrimary = '#E8992A';
  const orangeDark = '#D68619';

  // The speed clock + cloche symbol
  const LogoSymbol = ({ size = 38 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <defs>
        <linearGradient id="fastGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA41C" />
          <stop offset="100%" stopColor="#E8992A" />
        </linearGradient>
        <linearGradient id="clocheGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFAE34" />
          <stop offset="100%" stopColor="#D97A08" />
        </linearGradient>
      </defs>

      {/* Speed motion lines on left */}
      <rect x="6" y="26" width="22" height="5" rx="2.5" fill={orangePrimary} />
      <rect x="2" y="44" width="26" height="6.5" rx="3.25" fill={orangePrimary} />
      <rect x="8" y="62" width="20" height="5" rx="2.5" fill={orangePrimary} />

      {/* Top Cloche (Food Dome) */}
      {/* Handle */}
      <circle cx="70" cy="12" r="4.5" fill={orangePrimary} />
      {/* Dome Body */}
      <path
        d="M50 25 C50 14, 90 14, 90 25 Z"
        fill="url(#clocheGrad)"
      />
      {/* Dome Rim / Base */}
      <rect x="47" y="25" width="46" height="5" rx="2.5" fill="#FFFFFF" />

      {/* Alarm Clock Body */}
      <circle
        cx="62"
        cy="58"
        r="30"
        fill="#FFFFFF"
        stroke="#241F1A"
        strokeWidth="6.5"
      />

      {/* Clock inner face */}
      <circle cx="62" cy="58" r="22" fill="#241F1A" />

      {/* Clock hands pointing at 10:10/motion */}
      <line
        x1="62"
        y1="58"
        x2="62"
        y2="42"
        stroke={orangePrimary}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="62"
        y1="58"
        x2="48"
        y2="50"
        stroke={orangePrimary}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="62" cy="58" r="3.5" fill="#FFFFFF" />

      {/* Speed splash droplet top right */}
      <circle cx="86" cy="18" r="2.5" fill={orangePrimary} />
      <path
        d="M92 14 C92 12, 95 10, 96 8 C97 10, 98 12, 98 14 C98 15.6, 95.3 17, 92 14 Z"
        fill={orangePrimary}
      />
    </svg>
  );

  // App Icon Badge variant (like the app icon in the design reference)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center p-3 rounded-2xl bg-[#241F1A] shadow-warm ${className}`}>
        <LogoSymbol size={44} />
      </div>
    );
  }

  const content = (
    <div dir="ltr" className={`group inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="flex flex-col text-left">
        <div className="flex items-baseline tracking-tight font-display font-bold leading-none">
          <span
            className={`font-black text-primary ${
              variant === 'compact' ? 'text-xl' : 'text-2xl sm:text-3xl'
            }`}
            style={{
              background: 'linear-gradient(135deg, #FFA41C 0%, #E8992A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FAST
          </span>
          <span
            style={{ color: textColor }}
            className={variant === 'compact' ? 'text-xl' : 'text-2xl sm:text-3xl'}
          >
            Order
          </span>
        </div>
        {showTagline && variant !== 'compact' && (
          <span
            className="text-[9px] font-mono tracking-[0.22em] font-semibold mt-1 uppercase"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6B6255' }}
          >
            ORDER • WAIT • ENJOY
          </span>
        )}
      </div>
      <LogoSymbol size={variant === 'compact' ? 32 : 42} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
};
