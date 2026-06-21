/**
 * Generate a random unique ID.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

/**
 * Normalized comparison for Arabic starts-with checking.
 * Ignores alif-lam, unifies alifs.
 */
export function cleanArabicWord(word: string): string {
  if (!word) return "";
  let cleaned = word.trim();
  // Remove "ال" prefix if word is longer than 3 characters (e.g., الأسد -> أسد, but بلد stays)
  if (cleaned.startsWith("ال") && cleaned.length > 3) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function startsWithLetter(word: string, letter: string): boolean {
  const cleanedWord = cleanArabicWord(word);
  if (!cleanedWord) return false;

  const firstChar = cleanedWord.charAt(0);
  const normalizedLetter = letter.trim();

  // Normalize Alif variations
  const alifGroup = ["أ", "إ", "آ", "ا"];
  if (alifGroup.includes(normalizedLetter)) {
    return alifGroup.includes(firstChar);
  }

  // Normalize Haa / Taa Marbuta start characters
  if (normalizedLetter === "هـ" || normalizedLetter === "ه") {
    return firstChar === "هـ" || firstChar === "ه";
  }

  return firstChar === normalizedLetter;
}

// ----------------------------------------------------
// WEB AUDIO API SOUND SYNTHESIS METHODS (MUTABLE)
// ----------------------------------------------------

let isMutedGlobal = false;

export function setMuteState(muted: boolean) {
  isMutedGlobal = muted;
}

export function getMuteState() {
  return isMutedGlobal;
}

export function playTickSound() {
  if (isMutedGlobal) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

export function playSuccessSound() {
  if (isMutedGlobal) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    playTone(523.25, now, 0.15); // C5
    playTone(659.25, now + 0.08, 0.15); // E5
    playTone(783.99, now + 0.16, 0.15); // G5
    playTone(1046.50, now + 0.24, 0.3); // C6
  } catch (e) {}
}

export function playWrongSound() {
  if (isMutedGlobal) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  } catch (e) {}
}

export function playSpinSound() {
  if (isMutedGlobal) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.5);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.5);
  } catch (e) {}
}
