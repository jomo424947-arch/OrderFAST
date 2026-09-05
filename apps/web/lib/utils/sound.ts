let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

/**
 * 1. Add to Cart Sound:
 * A crisp, cheerful pop + rising chime with snappy response
 */
export function playAddToCartSound() {
  const ctx = getAudioContext();
  triggerHaptic(20);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Fast cheerful attack (pop)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Harmonic sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.04);
    gain2.gain.setValueAtTime(0.12, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.18);
  } catch {
    // Graceful fallback
  }
}

/**
 * 2. Remove / Decrement Item Sound:
 * A gentle, soft downward tone
 */
export function playRemoveFromCartSound() {
  const ctx = getAudioContext();
  triggerHaptic(12);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    // Graceful fallback
  }
}

/**
 * 3. Order Placed Celebration Sound:
 * A triumphant, delightful 4-note chord arpeggio celebrating the order placement
 */
export function playOrderPlacedSuccessSound() {
  const ctx = getAudioContext();
  triggerHaptic([30, 40, 50, 60, 120]);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // C5, E5, G5, C6 notes with shimmer
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.22, vol: 0.3 },
      { freq: 659.25, time: 0.11, dur: 0.22, vol: 0.32 },
      { freq: 783.99, time: 0.22, dur: 0.28, vol: 0.35 },
      { freq: 1046.5, time: 0.33, dur: 0.7, vol: 0.4 },
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Warm high harmonic bell at finale
    const finalOsc = ctx.createOscillator();
    const finalGain = ctx.createGain();
    finalOsc.type = 'triangle';
    finalOsc.frequency.setValueAtTime(2093.0, now + 0.35);
    finalGain.gain.setValueAtTime(0.18, now + 0.35);
    finalGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    finalOsc.connect(finalGain);
    finalGain.connect(ctx.destination);
    finalOsc.start(now + 0.35);
    finalOsc.stop(now + 1.1);
  } catch {
    // Graceful fallback
  }
}

/**
 * 4. Micro Button Tap Sound:
 * Subtle tactile feedback for interactive clicks
 */
export function playButtonTapSound() {
  const ctx = getAudioContext();
  triggerHaptic(8);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Graceful fallback
  }
}

/**
 * 5. Intro Service Bell Ring ("الجرس بيرن"):
 * Authentic restaurant desk bell ding-ding sound
 */
export function playIntroBellRing() {
  const ctx = getAudioContext();
  triggerHaptic([25, 40, 30]);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const ringStrike = (startTime: number, pitchOffset = 1.0) => {
      // Fundamental bell tone ~2093 Hz (C7)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093 * pitchOffset, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.45);

      // Resonant harmonic overtone ~2637 Hz (E7)
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(2637 * pitchOffset, startTime);

      gainHarmonic.gain.setValueAtTime(0.2, startTime);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(ctx.destination);
      oscHarmonic.start(startTime);
      oscHarmonic.stop(startTime + 0.35);
    };

    ringStrike(now, 1.0);
    ringStrike(now + 0.22, 1.05);
  } catch {
    // Graceful fallback
  }
}

/**
 * 6. Intro Speed Dash Whoosh ("بيجري بسرعة"):
 * Rushing aerodynamic whoosh sweep
 */
export function playSpeedDashWhoosh() {
  const ctx = getAudioContext();
  triggerHaptic(40);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.45);

    // Lowpass filter for smooth wind effect
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Graceful fallback
  }
}

/**
 * 7. Intro Brand Reveal Chime:
 * Warm celebratory chime upon brand reveal
 */
export function playIntroBrandChime() {
  const ctx = getAudioContext();
  triggerHaptic([30, 80]);
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [659.25, 830.61, 987.77, 1318.5]; // E major chord
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.8);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Legacy chime function (double-bell notification chime)
 */
export function playNewOrderChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Tone 1 (High bell - E6 ~ 1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2 (Higher harmonic bell - A6 ~ 1760 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch {
    // Graceful fallback
  }
}
