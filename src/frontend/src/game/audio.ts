// Web Audio API-based sound effects for ColorBlast

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.3,
  delay = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + delay + duration,
  );

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

export function playCardSound(): void {
  playTone(440, 0.08, "square", 0.15);
  playTone(550, 0.06, "square", 0.1, 0.05);
}

export function playDrawSound(): void {
  playTone(300, 0.1, "sawtooth", 0.1);
  playTone(250, 0.08, "sawtooth", 0.08, 0.08);
}

export function playUnoSound(): void {
  // Fanfare: C E G C
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    playTone(freq, 0.15, "square", 0.25, i * 0.1);
  });
}

export function playWinSound(): void {
  // Victory jingle
  const melody = [
    { freq: 523.25, delay: 0 },
    { freq: 659.25, delay: 0.1 },
    { freq: 783.99, delay: 0.2 },
    { freq: 1046.5, delay: 0.3 },
    { freq: 783.99, delay: 0.45 },
    { freq: 1046.5, delay: 0.55 },
  ];
  for (const { freq, delay } of melody) {
    playTone(freq, 0.18, "sine", 0.3, delay);
  }
}

export function playLoseSound(): void {
  const melody = [
    { freq: 440, delay: 0 },
    { freq: 370, delay: 0.15 },
    { freq: 311, delay: 0.3 },
    { freq: 261, delay: 0.45 },
  ];
  for (const { freq, delay } of melody) {
    playTone(freq, 0.2, "sawtooth", 0.2, delay);
  }
}

export function playWildSound(): void {
  const colors = [261.63, 329.63, 392.0, 466.16];
  colors.forEach((freq, i) => {
    playTone(freq, 0.12, "triangle", 0.2, i * 0.06);
  });
}
