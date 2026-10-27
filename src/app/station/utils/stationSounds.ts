// Web Audio API engine for Phone Station Monitor
// Generates clean, zero-latency synthesizer chimes without needing external audio files.

class StationSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('station_sound_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    }
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('station_sound_muted', muted ? 'true' : 'false');
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Upbeat welcome chime when a session starts (C5 -> E5 -> G5 -> C6)
   */
  public playSessionStart() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteDuration = 0.12;

      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration * 1.5);
      });
    } catch {
      // Ignored for autoplay policy
    }
  }

  /**
   * Melodic double-tone warning chime for the 5-minute mark (D5 -> A5)
   */
  public playWarningChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const pairs = [
        { freq: 587.33, offset: 0, dur: 0.18 }, // D5
        { freq: 880.0, offset: 0.22, dur: 0.28 } // A5
      ];

      pairs.forEach(({ freq, offset, dur }) => {
        const startTime = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Distinct, rhythmic time-up alarm pattern (alert tone repeating)
   */
  public playTimeUpAlarm() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // Two rapid alert bursts
      const bursts = [0, 0.35, 0.7];

      bursts.forEach((burstOffset) => {
        const startTime = ctx.currentTime + burstOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, startTime); // A4
        osc.frequency.setValueAtTime(659.25, startTime + 0.1); // E5
        osc.frequency.setValueAtTime(440, startTime + 0.2); // A4

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Resonant desk bell chime for staff assistance call (C6 -> G6 harmonic)
   */
  public playStaffCallBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const freqs = [1046.5, 1567.98]; // C6 & G6 resonant bell harmonics
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * UI Click tone
   */
  public playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignored
    }
  }
}

export const stationSounds = new StationSoundEngine();
