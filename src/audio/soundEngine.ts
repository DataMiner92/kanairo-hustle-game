/**
 * Web Audio procedural sound synthesizer for Kanairo: Mtaa Hustle
 * Generates custom sound effects without external audio dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain: GainNode | null = null;
  private sirenFilter: BiquadFilterNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive: boolean = false;
  private currentSirenType: 'POLICE' | 'KANJO' = 'POLICE';
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private isRainActive: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopEngine();
      this.stopSiren();
      this.stopRain();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Classic M-Pesa incoming SMS chime (Two crisp cheerful high pings)
   */
  public playMpesaChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [1318.51, 1760.0]; // E6, A6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0, t + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }

  /**
   * Authentic Nairobi Matatu multi-tone custom horn
   */
  public playMatatuHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Classic syncopated melody: D4, F#4, A4, high D5
    const tones = [
      { freq: 293.66, start: 0, dur: 0.1 },
      { freq: 369.99, start: 0.12, dur: 0.1 },
      { freq: 440.0, start: 0.24, dur: 0.12 },
      { freq: 587.33, start: 0.4, dur: 0.3 },
    ];

    tones.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, t + n.start);

      // Low pass to give beefy horn acoustics
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      gain.gain.setValueAtTime(0, t + n.start);
      gain.gain.linearRampToValueAtTime(0.25, t + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + n.start);
      osc.stop(t + n.start + n.dur + 0.05);
    });
  }

  /**
   * Cash money / transaction register jingle
   */
  public playCashRegister() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.exponentialRampToValueAtTime(1567.98, t + 0.15);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * UI Click / Select
   */
  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Continuous procedural Siren loop synthesizer.
   * Dynamically modulates volume, pitch, and wail/yelp urgency
   * based on Kanjo Officer proximity and Police Heat level.
   *
   * @param active Whether the siren is currently triggered
   * @param intensity 0.0 (quiet/distant) to 1.0 (blaring/close proximity)
   * @param urgency 1.0 (slow wail) to 2.5 (frantic yelp)
   * @param sirenType 'POLICE' (deep authoritative sweep) or 'KANJO' (urgent high-pitch Nairobi County wail)
   */
  public updateSiren(
    active: boolean,
    intensity: number = 0.5,
    urgency: number = 1.2,
    sirenType: 'POLICE' | 'KANJO' = 'POLICE'
  ) {
    if (this.isMuted || !active) {
      this.stopSiren();
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const clampedIntensity = Math.max(0.05, Math.min(1.0, intensity));
    const targetVolume = 0.025 + clampedIntensity * 0.12; // 0.025 -> 0.145 max
    const targetLfoRate = Math.max(0.8, Math.min(2.8, urgency));
    const baseFreq = sirenType === 'KANJO' ? 920 : 780;
    const modDepth = sirenType === 'KANJO' ? 240 + clampedIntensity * 60 : 200 + clampedIntensity * 80;

    if (!this.isSirenActive || !this.sirenOsc || !this.sirenGain) {
      this.isSirenActive = true;
      this.currentSirenType = sirenType;

      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(targetLfoRate, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(modDepth, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Lowpass filter to tame harsh harmonics
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

      mainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 0.12);

      osc.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      lfo.start();
      osc.start();

      this.sirenOsc = osc;
      this.sirenLfo = lfo;
      this.sirenLfoGain = lfoGain;
      this.sirenFilter = filter;
      this.sirenGain = mainGain;
    } else {
      // Dynamic updates on running loop
      const now = this.ctx.currentTime;
      this.sirenGain.gain.setTargetAtTime(targetVolume, now, 0.08);

      if (this.sirenLfo) {
        this.sirenLfo.frequency.setTargetAtTime(targetLfoRate, now, 0.1);
      }
      if (this.sirenLfoGain) {
        this.sirenLfoGain.gain.setTargetAtTime(modDepth, now, 0.1);
      }
      if (this.sirenOsc && this.currentSirenType !== sirenType) {
        this.currentSirenType = sirenType;
        this.sirenOsc.frequency.setTargetAtTime(baseFreq, now, 0.15);
      }
    }
  }

  public stopSiren() {
    if (!this.isSirenActive) return;

    if (this.sirenGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.sirenGain.gain.setTargetAtTime(0.0001, now, 0.1);
      } catch {
        // ignore
      }
    }

    const osc = this.sirenOsc;
    const lfo = this.sirenLfo;
    const lfoGain = this.sirenLfoGain;
    const filter = this.sirenFilter;
    const gain = this.sirenGain;

    this.sirenOsc = null;
    this.sirenLfo = null;
    this.sirenLfoGain = null;
    this.sirenFilter = null;
    this.sirenGain = null;
    this.isSirenActive = false;

    setTimeout(() => {
      try {
        if (osc) {
          osc.stop();
          osc.disconnect();
        }
        if (lfo) {
          lfo.stop();
          lfo.disconnect();
        }
        if (lfoGain) lfoGain.disconnect();
        if (filter) filter.disconnect();
        if (gain) gain.disconnect();
      } catch {
        // ignore
      }
    }, 150);
  }

  /**
   * Police siren trigger helper (backward-compatible)
   */
  public setPoliceSiren(active: boolean) {
    this.updateSiren(active, 0.7, 1.2, 'POLICE');
  }

  /**
   * Collision thud
   */
  public playCollision() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Piercing Nairobi County Kanjo askari whistle with dual-tone air warble
   */
  public playKanjoWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    // Whistle dual resonant frequencies: ~2450Hz and ~2780Hz with 18Hz vibrato
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2450, t);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2780, t);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(18, t);
    lfoGain.gain.setValueAtTime(95, t);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
    gain.gain.setValueAtTime(0.24, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc1.start(t);
    osc2.start(t);
    lfo.stop(t + 0.55);
    osc1.stop(t + 0.55);
    osc2.stop(t + 0.55);
  }

  /**
   * Continuous engine rumble when player is in vehicle
   */
  public updateEngine(inVehicle: boolean, speedNorm: number) {
    if (this.isMuted || !inVehicle) {
      this.stopEngine();
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    if (!this.engineOsc) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 65;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      gain.gain.value = 0.06;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.engineOsc = osc;
      this.engineGain = gain;
    }

    if (this.engineOsc) {
      const targetFreq = 55 + speedNorm * 130;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    }
  }

  private stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // ignore
      }
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  /**
   * Mission complete trumpet flourish
   */
  public playMissionComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, s: 0, d: 0.15 },
      { f: 659.25, s: 0.16, d: 0.15 },
      { f: 783.99, s: 0.32, d: 0.18 },
      { f: 1046.5, s: 0.5, d: 0.4 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.s);

      gain.gain.setValueAtTime(0, t + n.s);
      gain.gain.linearRampToValueAtTime(0.2, t + n.s + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.s + n.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + n.s);
      osc.stop(t + n.s + n.d + 0.05);
    });
  }

  /**
   * Continuous ambient rain sound using filtered white noise
   */
  public updateWeatherAudio(weather: 'SUNNY' | 'CLOUDY' | 'RAINY') {
    if (this.isMuted || weather !== 'RAINY') {
      this.stopRain();
      return;
    }
    if (this.isRainActive) return;

    this.initCtx();
    if (!this.ctx) return;

    try {
      this.isRainActive = true;
      // Generate 2 seconds of looping white noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter for rain sound (bandpass with focus around 800-1200Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.rainSource = noise;
      this.rainGain = gain;
    } catch {
      this.isRainActive = false;
    }
  }

  public stopRain() {
    if (this.rainSource) {
      try {
        if (this.rainGain && this.ctx) {
          this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
        setTimeout(() => {
          try {
            this.rainSource?.stop();
            this.rainSource?.disconnect();
          } catch {
            // ignore
          }
          this.rainSource = null;
          this.rainGain = null;
        }, 600);
      } catch {
        this.rainSource = null;
        this.rainGain = null;
      }
    }
    this.isRainActive = false;
  }

  /**
   * Deep low-frequency distant thunder rumble
   */
  public playThunder() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 1.8);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 2.3);
  }
}

export const soundEngine = new SoundEngine();
