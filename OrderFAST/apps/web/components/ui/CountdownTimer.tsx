'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
  prefix?: string;
}

/**
 * Isolated, zero-overhead countdown timer component.
 * Calculates remaining seconds locally via timestamp delta
 * without mutating global Zustand state or re-rendering parent pages.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  className = 'font-mono font-bold text-xs',
  prefix = '',
}) => {
  const computeRemaining = () => {
    const target = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((target - now) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(computeRemaining);

  useEffect(() => {
    setSecondsLeft(computeRemaining());

    const timer = setInterval(() => {
      const remaining = computeRemaining();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <span className={className}>
      {prefix}
      {formatted}
    </span>
  );
};
