/**
 * Utility for persisting First-Launch Intro state
 * Uses localStorage to persist whether the user has seen the FASTorder intro.
 */

const INTRO_SEEN_KEY = 'fastorder_intro_seen';

export function hasSeenIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
  } catch {
    // Graceful fallback if localStorage is disabled
  }
}

export function resetIntroSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTRO_SEEN_KEY);
  } catch {
    // Graceful fallback
  }
}
