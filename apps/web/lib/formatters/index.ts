/**
 * Formats a number into Egyptian Pounds (ج.م)
 * @example formatEGP(43) => "43 ج.م"
 */
export function formatEGP(amount: number): string {
  return `${amount} ج.م`;
}

/**
 * Formats minutes into Arabic wait string
 * @example formatWaitTime(15) => "15 د"
 * @example formatWaitTime(15, true) => "~15 د"
 */
export function formatWaitTime(minutes: number, approx = false): string {
  return `${approx ? '~' : ''}${minutes} د`;
}

/**
 * Formats seconds into MM:SS
 * @example formatSecondsTimer(220) => "3:40"
 */
export function formatSecondsTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats ISO date string to Arabic friendly relative/short time
 */
export function formatArabicTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'الآن';
  }
}

/**
 * Formats ISO date string to full Arabic friendly date and time
 * @example "الثلاثاء، 29 سبتمبر 2026 · 01:16 م"
 */
export function formatArabicDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} · ${timeStr}`;
  } catch {
    return isoString;
  }
}
