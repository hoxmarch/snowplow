/**
 * Procedural Web Audio synthesizer for Frosty Hollow.
 * Zero external audio files — 100% generated in real-time.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Snow plowing continuous sound
  private plowNoiseNode: AudioNode | null = null;
  private plowGain: GainNode | null = null;
  private plowFilter: BiquadFilterNode | null = null;

  // Background music state
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private chordIndex: number = 0;

  // Cozy chord progression (frequencies in Hz)
  private readonly chords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7 (C4, E4, G4, B4)
    [220.0, 261.63, 329.63, 392.0],  // Am7 (A3, C4, E4, G4)
    [293.66, 349.23, 440.0, 523.25], // Dm7 (D4, F4, A4, C5)
    [196.0, 246.94, 293.66, 349.23], // G7 (G3, B3, D4, F4)
    [220.0, 277.18, 329.63, 415.3],  // A7 (A3, C#4, E4, G#4)
    [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
    [196.0, 246.94, 293.66, 392.0],  // G (G3, B3, D4, G4)
    [261.63, 329.63, 392.0, 523.25], // C add9
  ];

  constructor() {
    // Lazily initialized on first user interaction to satisfy browser autoplay policies
  }

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.masterGain);

    this.setupEngineSound();
    this.setupPlowSound();
  }

  private setupEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Dual oscillator warm engine rumble
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'triangle';
    this.engineOsc.frequency.value = 42;

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sawtooth';
    this.engineSubOsc.frequency.value = 21;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 160;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.05;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  private setupPlowSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Generate white noise buffer for snow rushing
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    this.plowFilter = this.ctx.createBiquadFilter();
    this.plowFilter.type = 'bandpass';
    this.plowFilter.frequency.value = 750;
    this.plowFilter.Q.value = 1.2;

    this.plowGain = this.ctx.createGain();
    this.plowGain.gain.value = 0.0; // starts silent

    noiseSource.connect(this.plowFilter);
    this.plowFilter.connect(this.plowGain);
    this.plowGain.connect(this.sfxGain);

    noiseSource.start();
    this.plowNoiseNode = noiseSource;
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateEngine(speedNormalized: number, isPlowing: boolean) {
    if (!this.ctx || this.isMuted) return;

    const absSpeed = Math.abs(speedNormalized);
    const targetFreq = 40 + absSpeed * 85;
    const targetFilter = 140 + absSpeed * 320;
    const targetGain = 0.04 + absSpeed * 0.12;

    const t = this.ctx.currentTime;
    if (this.engineOsc && this.engineSubOsc && this.engineFilter && this.engineGain) {
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
      this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.08);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.08);
      this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
    }

    // Update snow plowing whoosh
    if (this.plowGain && this.plowFilter) {
      const plowVolume = isPlowing && absSpeed > 0.1 ? Math.min(0.28, absSpeed * 0.3) : 0;
      this.plowGain.gain.setTargetAtTime(plowVolume, t, 0.05);
      this.plowFilter.frequency.setTargetAtTime(650 + absSpeed * 400, t, 0.05);
    }
  }

  public playHonk() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const tone1 = this.ctx.createOscillator();
    const tone2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    tone1.type = 'triangle';
    tone2.type = 'sawtooth';

    // Friendly dual-tone European/midwest town plow horn (F4 & A4)
    tone1.frequency.setValueAtTime(349.23, t);
    tone2.frequency.setValueAtTime(440.0, t);

    // Filter to give soft vintage horn body
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
    gain.gain.setValueAtTime(0.25, t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    tone1.connect(filter);
    tone2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    tone1.start(t);
    tone2.start(t);
    tone1.stop(t + 0.36);
    tone2.stop(t + 0.36);
  }

  public playCoin() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Bright bell chime (B5 up to E6)
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playComboUp(comboLevel: number) {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const baseFreq = baseFreqs[Math.min(comboLevel - 1, baseFreqs.length - 1)] || 523.25;

    // Harmonized double ping
    [baseFreq, baseFreq * 1.25].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.16, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.36);
    });
  }

  public playQuestComplete() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    fanfareNotes.forEach((freq, index) => {
      const noteTime = t + index * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const duration = index === fanfareNotes.length - 1 ? 0.6 : 0.18;
      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.02);
    });
  }

  public playUpgrade() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playSnowballPop() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playBirdChirp() {
    this.resume();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Two rapid cheerful chirps
    [0, 0.08, 0.16].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      const baseF = 2400 + idx * 300;
      osc.frequency.setValueAtTime(baseF, t + delay);
      osc.frequency.exponentialRampToValueAtTime(baseF + 900, t + delay + 0.03);
      osc.frequency.exponentialRampToValueAtTime(baseF - 200, t + delay + 0.06);

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.12, t + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + delay);
      osc.stop(t + delay + 0.065);
    });
  }

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.resume();
    this.isMusicPlaying = true;

    // Play a gentle, relaxing chord every 3.2 seconds
    this.playNextMusicChord();
    this.musicInterval = window.setInterval(() => {
      this.playNextMusicChord();
    }, 3200);
  }

  private playNextMusicChord() {
    if (!this.ctx || !this.musicGain || this.isMuted || !this.isMusicPlaying) return;

    const chord = this.chords[this.chordIndex];
    this.chordIndex = (this.chordIndex + 1) % this.chords.length;

    const t = this.ctx.currentTime;

    // Arpeggiated soft warm bell/rhodes sound for cozy winter atmosphere
    chord.forEach((freq, noteIdx) => {
      const delay = noteIdx * 0.07;
      const noteTime = t + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      // Add very gentle subtle vibrato
      const vibrato = this.ctx!.createOscillator();
      const vibratoGain = this.ctx!.createGain();
      vibrato.frequency.value = 4.5;
      vibratoGain.gain.value = 1.2;
      vibrato.connect(osc.frequency);
      vibrato.start(noteTime);
      vibrato.stop(noteTime + 2.8);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.06, noteTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0005, noteTime + 2.8);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 2.9);
    });
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();
