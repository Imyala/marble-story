/**
 * Every sound in the game is synthesized with WebAudio at runtime: no sample
 * files. SFX are short envelopes over oscillators and filtered noise; music is
 * a small step sequencer with an exploration layer and a combat layer that
 * fades in while enemies are engaged.
 */

type Wave = OscillatorType;

export type Sfx =
  | 'swing' | 'swingHeavy' | 'hit' | 'hitHeavy' | 'jump' | 'flap' | 'land' | 'dodge' | 'perfect'
  | 'gem' | 'gemBlue' | 'gemRed' | 'gemGreen' | 'gemPurple' | 'shard' | 'crystalBreak'
  | 'fireBurst' | 'zap' | 'iceCrack' | 'shatter' | 'rumble' | 'explosion' | 'steam'
  | 'enemyAlert' | 'enemyDie' | 'enemyHurt' | 'enemyAttack' | 'shieldBlock' | 'bossRoar'
  | 'hurt' | 'death' | 'ui' | 'uiConfirm' | 'uiBack' | 'checkpoint' | 'fury' | 'dragonTimeOn'
  | 'dragonTimeOff' | 'unlock' | 'door' | 'torch' | 'switch' | 'splash' | 'charge' | 'pound'
  | 'levelUp' | 'talk' | 'launch' | 'counter' | 'relic' | 'cue' | 'woodBreak' | 'potBreak' | 'chest' | 'page' | 'egg' | 'thunder';

export type LoopId = 'breath' | 'glide' | 'charge' | 'rain';

/** A realm's background soundscape. */
export type AmbienceKind = 'fen' | 'sanctum' | 'falls' | 'frostworks' | 'plains' | 'keep';

interface AmbienceDef {
  /** Continuous bed: filtered noise, with slow gusts. */
  bed: { type: BiquadFilterType; freq: number; q: number; vol: number; gust: number; drone?: number[] };
  /** Occasional sounds: [name, min gap, max gap]. */
  calls: [string, number, number][];
}

const AMBIENCE: Record<AmbienceKind, AmbienceDef> = {
  fen: { bed: { type: 'lowpass', freq: 520, q: 0.5, vol: 0.035, gust: 0.3 }, calls: [['frog', 1.5, 5], ['cricket', 0.8, 2.5], ['owl', 12, 26]] },
  sanctum: { bed: { type: 'bandpass', freq: 900, q: 0.4, vol: 0.022, gust: 0.6 }, calls: [['bird', 1.5, 5], ['bird', 3, 8]] },
  falls: { bed: { type: 'lowpass', freq: 760, q: 0.3, vol: 0.075, gust: 0.25 }, calls: [['hawk', 14, 30], ['gust', 6, 14]] },
  frostworks: { bed: { type: 'bandpass', freq: 420, q: 1.2, vol: 0.05, gust: 0.8 }, calls: [['clang', 2.5, 7], ['creak', 9, 20], ['gust', 5, 11]] },
  plains: { bed: { type: 'bandpass', freq: 1300, q: 0.35, vol: 0.028, gust: 0.7 }, calls: [['lark', 2.5, 6], ['buzz', 8, 16], ['bird', 4, 9]] },
  keep: { bed: { type: 'lowpass', freq: 300, q: 0.6, vol: 0.04, gust: 0.4, drone: [55, 82.4] }, calls: [['crow', 6, 14], ['chime', 9, 20]] },
};

export interface MusicTheme {
  bpm: number;
  /** Chord roots in semitones relative to A3, one per bar. */
  chords: number[][];
  /** Melody scale degrees (semitones) the arpeggiator walks. */
  scale: number[];
  pad: Wave;
  lead: Wave;
  mood: 'bright' | 'mysterious' | 'tense' | 'heroic' | 'calm';
}

const A3 = 220;
const semis = (n: number) => A3 * Math.pow(2, n / 12);

export class Audio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private exploreBus!: GainNode;
  private combatBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private loops = new Map<LoopId, { src: AudioBufferSourceNode | OscillatorNode; gain: GainNode; filter: BiquadFilterNode; extra?: OscillatorNode }>();
  volume = 0.8;
  musicVolume = 0.55;
  sfxVolume = 0.9;
  private theme: MusicTheme | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private schedTimer: number | null = null;
  private combat = 0;
  private lastPlayed = new Map<string, number>();
  private ambBus!: GainNode;
  private muffler!: BiquadFilterNode;
  private muffleAmt = 0;
  private amb: { kind: AmbienceKind; nodes: AudioScheduledSourceNode[]; gain: GainNode; timers: number[] } | null = null;
  private wantAmb: AmbienceKind | null = null;

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.volume;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    // A lowpass that muffles the mix in Dragon Time and behind menus.
    this.muffler = c.createBiquadFilter();
    this.muffler.type = 'lowpass';
    this.muffler.frequency.value = 20000;
    this.muffler.Q.value = 0.5;
    this.master.connect(this.muffler).connect(comp).connect(c.destination);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = this.sfxVolume;
    this.sfxBus.connect(this.master);
    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.musicVolume;
    this.musicBus.connect(this.master);
    this.exploreBus = c.createGain();
    this.exploreBus.connect(this.musicBus);
    this.combatBus = c.createGain();
    this.combatBus.gain.value = 0;
    this.combatBus.connect(this.musicBus);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.ambBus = c.createGain();
    this.ambBus.gain.value = 1;
    this.ambBus.connect(this.sfxBus);
    if (this.theme) this.startScheduler();
    if (this.wantAmb) this.setAmbience(this.wantAmb);
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.volume;
    this.sfxBus.gain.value = this.sfxVolume;
    this.musicBus.gain.value = this.musicVolume;
  }

  // ---- primitives ---------------------------------------------------------

  private tone(freq: number, dur: number, wave: Wave, vol: number, opts: {
    slide?: number; attack?: number; delay?: number; bus?: AudioNode; filter?: number; q?: number; detune?: number;
  } = {}): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + (opts.delay ?? 0);
    const o = c.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (opts.detune) o.detune.value = opts.detune;
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
    const g = c.createGain();
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = o;
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      f.Q.value = opts.q ?? 0.7;
      o.connect(f);
      node = f;
    }
    node.connect(g).connect(opts.bus ?? this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, opts: {
    type?: BiquadFilterType; freq?: number; freqEnd?: number; q?: number; attack?: number; delay?: number; bus?: AudioNode;
  } = {}): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + (opts.delay ?? 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.setValueAtTime(opts.freq ?? 1000, t);
    if (opts.freqEnd) f.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + dur);
    f.Q.value = opts.q ?? 1;
    const g = c.createGain();
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(opts.bus ?? this.sfxBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  /** 0 = clear, 1 = heavily muffled (as if underwater). Eases toward the target. */
  setMuffle(amount: number): void {
    const c = this.ctx;
    if (!c || Math.abs(amount - this.muffleAmt) < 0.01) return;
    this.muffleAmt = amount;
    const hz = 20000 * Math.pow(600 / 20000, amount);
    this.muffler.frequency.setTargetAtTime(hz, c.currentTime, 0.12);
  }

  /** A footfall on the given ground: soft on grass and snow, a click on stone, a knock on wood. */
  footstep(surface: string, vol = 1): void {
    const c = this.ctx;
    if (!c) return;
    const v = 0.5 * vol * (0.8 + Math.random() * 0.4);
    switch (surface) {
      case 'stone': case 'metal': case 'crystal':
        this.noise(0.05, 0.05 * v, { type: 'highpass', freq: 2200 });
        this.tone(140 + Math.random() * 40, 0.06, 'sine', 0.05 * v);
        break;
      case 'wood':
        this.tone(170 + Math.random() * 40, 0.08, 'triangle', 0.07 * v, { filter: 900 });
        this.noise(0.04, 0.025 * v, { type: 'bandpass', freq: 1400 });
        break;
      case 'snow': case 'ice':
        this.noise(0.09, 0.07 * v, { type: 'bandpass', freq: 3200 + Math.random() * 800, q: 1.2 });
        break;
      case 'water':
        this.noise(0.14, 0.06 * v, { type: 'bandpass', freq: 900, freqEnd: 2200, q: 1.5 });
        break;
      case 'mud':
        this.noise(0.1, 0.05 * v, { type: 'lowpass', freq: 600 });
        break;
      default: // grass, sand
        this.noise(0.07, 0.045 * v, { type: 'bandpass', freq: 1800 + Math.random() * 600, q: 0.9 });
    }
  }

  // ---- ambience -------------------------------------------------------------

  /** Starts a realm's soundscape (or silence with null). Safe before audio unlocks. */
  setAmbience(kind: AmbienceKind | null): void {
    this.wantAmb = kind;
    const c = this.ctx;
    if (!c) return;
    if (this.amb && this.amb.kind === kind) return;
    if (this.amb) {
      const old = this.amb;
      old.gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.6);
      for (const n of old.nodes) n.stop(c.currentTime + 3);
      old.timers.length = 0;
      this.amb = null;
    }
    if (!kind) return;
    const def = AMBIENCE[kind];
    const gain = c.createGain();
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(1, c.currentTime, 1.5);
    gain.connect(this.ambBus);
    const nodes: AudioScheduledSourceNode[] = [];
    // The bed: noise through a filter, swelling and falling slowly like wind.
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = def.bed.type;
    f.frequency.value = def.bed.freq;
    f.Q.value = def.bed.q;
    const bedGain = c.createGain();
    bedGain.gain.value = def.bed.vol;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.06 + Math.random() * 0.05;
    const lfoGain = c.createGain();
    lfoGain.gain.value = def.bed.vol * def.bed.gust;
    lfo.connect(lfoGain).connect(bedGain.gain);
    src.connect(f).connect(bedGain).connect(gain);
    src.start(0, Math.random());
    lfo.start();
    nodes.push(src, lfo);
    for (const hz of def.bed.drone ?? []) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz;
      const og = c.createGain();
      og.gain.value = 0.018;
      o.connect(og).connect(gain);
      o.start();
      nodes.push(o);
    }
    const timers = def.calls.map(([, a, b]) => a + Math.random() * (b - a));
    this.amb = { kind, nodes, gain, timers };
  }

  /** Advances the soundscape's occasional calls. */
  ambienceTick(dt: number): void {
    const a = this.amb;
    const c = this.ctx;
    if (!a || !c) return;
    const def = AMBIENCE[a.kind];
    def.calls.forEach(([name, lo, hi], i) => {
      a.timers[i]! -= dt;
      if (a.timers[i]! > 0) return;
      a.timers[i] = lo + Math.random() * (hi - lo);
      this.ambientCall(name, a.gain);
    });
  }

  private ambientCall(name: string, out: AudioNode): void {
    const c = this.ctx!;
    // Somewhere off to one side, not too loud.
    const pan = c.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(out);
    const b = { bus: pan };
    const r = Math.random;
    switch (name) {
      case 'frog': {
        const f = 110 + r() * 60;
        for (let i = 0; i < 2; i++) this.tone(f, 0.12, 'square', 0.03, { ...b, filter: 500, delay: i * 0.16, slide: f * 0.8 });
        break;
      }
      case 'cricket': {
        const f = 4200 + r() * 800;
        for (let i = 0; i < 3 + Math.floor(r() * 3); i++) this.tone(f, 0.03, 'sine', 0.012, { ...b, delay: i * 0.07 });
        break;
      }
      case 'owl':
        this.tone(420, 0.35, 'sine', 0.035, { ...b, slide: 380, attack: 0.05 });
        this.tone(400, 0.5, 'sine', 0.03, { ...b, slide: 360, attack: 0.06, delay: 0.5 });
        break;
      case 'bird': {
        const f = 2400 + r() * 1400;
        const n = 2 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) this.tone(f * (0.9 + r() * 0.25), 0.07, 'sine', 0.018, { ...b, slide: f * (1.2 + r() * 0.3), delay: i * (0.09 + r() * 0.05) });
        break;
      }
      case 'lark': {
        for (let i = 0; i < 8; i++) this.tone(3000 + r() * 1800, 0.04, 'sine', 0.014, { ...b, slide: 3500 + r() * 1500, delay: i * 0.055 });
        break;
      }
      case 'hawk':
        this.tone(2600, 0.9, 'sine', 0.03, { ...b, slide: 1500, attack: 0.08 });
        this.noise(0.9, 0.012, { type: 'bandpass', freq: 2400, freqEnd: 1500, q: 6, bus: pan, attack: 0.08 });
        break;
      case 'gust':
        this.noise(2.4, 0.05, { type: 'bandpass', freq: 380, freqEnd: 900, q: 0.8, attack: 0.9, bus: pan });
        break;
      case 'clang': {
        // A distant forge hammer: a few inharmonic partials, softened by distance.
        const base = 520 + r() * 120;
        for (const [k, v] of [[1, 0.02], [2.76, 0.012], [5.4, 0.006]] as const) this.tone(base * k, 0.9, 'sine', v, { ...b, filter: 2400 });
        this.noise(0.08, 0.02, { type: 'highpass', freq: 1800, bus: pan });
        break;
      }
      case 'creak':
        this.tone(160 + r() * 60, 0.6, 'sawtooth', 0.012, { ...b, filter: 700, slide: 120, attack: 0.1 });
        break;
      case 'buzz':
        this.tone(190 + r() * 40, 0.8, 'sawtooth', 0.008, { ...b, filter: 900, attack: 0.2, slide: 220 });
        break;
      case 'crow': {
        const n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) this.tone(640, 0.22, 'sawtooth', 0.022, { ...b, filter: 1400, q: 3, slide: 460, delay: i * 0.3 });
        break;
      }
      case 'chime': {
        const f = [523, 659, 784, 988][Math.floor(r() * 4)]!;
        this.tone(f, 2.4, 'sine', 0.02, { ...b, attack: 0.01 });
        this.tone(f * 2.01, 1.6, 'sine', 0.008, { ...b, attack: 0.01 });
        break;
      }
    }
  }

  // ---- sound effects ------------------------------------------------------

  play(id: Sfx, pitch = 1, vol = 1): void {
    if (!this.ctx) return;
    // Rate-limit identical sounds so a 12-hit breath does not stack 12 voices.
    const now = this.ctx.currentTime;
    const last = this.lastPlayed.get(id) ?? -1;
    const minGap = id.startsWith('gem') ? 0.03 : 0.04;
    if (now - last < minGap) return;
    this.lastPlayed.set(id, now);
    const p = pitch;
    const v = vol;
    switch (id) {
      case 'swing':
        this.noise(0.14, 0.28 * v, { type: 'bandpass', freq: 900 * p, freqEnd: 2600 * p, q: 1.4, attack: 0.02 });
        break;
      case 'swingHeavy':
        this.noise(0.24, 0.35 * v, { type: 'bandpass', freq: 400 * p, freqEnd: 1400 * p, q: 1.2, attack: 0.03 });
        break;
      case 'hit':
        this.tone(180 * p, 0.12, 'sine', 0.5 * v, { slide: 70 });
        this.noise(0.08, 0.35 * v, { type: 'highpass', freq: 1800 * p });
        break;
      case 'hitHeavy':
        this.tone(120 * p, 0.25, 'sine', 0.7 * v, { slide: 40 });
        this.noise(0.18, 0.45 * v, { type: 'lowpass', freq: 1400 * p, freqEnd: 300 });
        this.tone(90 * p, 0.2, 'square', 0.12 * v, { slide: 45, filter: 600 });
        break;
      case 'counter':
        this.tone(660 * p, 0.3, 'triangle', 0.3 * v, { slide: 1320 });
        this.tone(140, 0.3, 'sine', 0.6 * v, { slide: 40 });
        this.noise(0.25, 0.4 * v, { type: 'highpass', freq: 2500 });
        break;
      case 'launch':
        this.tone(200 * p, 0.25, 'sine', 0.5 * v, { slide: 520 });
        this.noise(0.2, 0.3 * v, { type: 'bandpass', freq: 500, freqEnd: 2500, q: 1.2 });
        break;
      case 'jump':
        this.noise(0.12, 0.12 * v, { type: 'bandpass', freq: 700, freqEnd: 1600 });
        break;
      case 'flap':
        this.noise(0.2, 0.25 * v, { type: 'lowpass', freq: 900, freqEnd: 300, attack: 0.03 });
        this.tone(95, 0.15, 'sine', 0.2 * v, { slide: 60 });
        break;
      case 'land':
        this.tone(90, 0.1, 'sine', 0.3 * v, { slide: 50 });
        this.noise(0.08, 0.12 * v, { type: 'lowpass', freq: 600 });
        break;
      case 'dodge':
        this.noise(0.18, 0.25 * v, { type: 'bandpass', freq: 1500, freqEnd: 500, q: 0.8, attack: 0.01 });
        break;
      case 'perfect':
        this.tone(880, 0.5, 'sine', 0.25 * v, { slide: 1760, attack: 0.01 });
        this.tone(1320, 0.6, 'triangle', 0.18 * v, { delay: 0.05 });
        this.noise(0.4, 0.15 * v, { type: 'highpass', freq: 5000, freqEnd: 9000 });
        break;
      case 'gem':
      case 'gemBlue':
        this.tone(1318 * p, 0.18, 'sine', 0.2 * v);
        this.tone(1975 * p, 0.2, 'sine', 0.12 * v, { delay: 0.04 });
        break;
      case 'gemRed':
        this.tone(988 * p, 0.2, 'sine', 0.2 * v);
        this.tone(1318 * p, 0.22, 'triangle', 0.1 * v, { delay: 0.05 });
        break;
      case 'gemGreen':
        this.tone(1175 * p, 0.2, 'sine', 0.2 * v);
        this.tone(1568 * p, 0.2, 'sine', 0.1 * v, { delay: 0.05 });
        break;
      case 'gemPurple':
        this.tone(740 * p, 0.3, 'triangle', 0.2 * v, { slide: 1480 });
        break;
      case 'shard':
        [0, 4, 7, 12].forEach((s, i) => this.tone(semis(24 + s), 0.5, 'triangle', 0.2, { delay: i * 0.07 }));
        break;
      case 'relic':
        [0, 3, 7, 10, 14].forEach((s, i) => this.tone(semis(12 + s), 0.9, 'sine', 0.18, { delay: i * 0.1, attack: 0.02 }));
        break;
      case 'woodBreak':
        // A dry crack, then splinters.
        this.noise(0.09, 0.5 * v, { type: 'bandpass', freq: 1400 * p, q: 0.9 });
        this.tone(150 * p, 0.12, 'square', 0.14 * v, { slide: 60, filter: 900 });
        for (let i = 0; i < 3; i++) this.noise(0.05, 0.18 * v, { type: 'bandpass', freq: 2200 + Math.random() * 1600, q: 2, delay: 0.05 + i * 0.04 });
        break;
      case 'potBreak':
        this.noise(0.12, 0.4 * v, { type: 'highpass', freq: 1800 * p });
        for (let i = 0; i < 3; i++) this.tone(900 + Math.random() * 900, 0.1, 'triangle', 0.08 * v, { delay: i * 0.035 });
        break;
      case 'chest':
        this.tone(220 * p, 0.25, 'triangle', 0.25 * v, { slide: 330 });
        for (let i = 0; i < 5; i++) this.tone(880 * Math.pow(1.19, i), 0.3, 'sine', 0.12 * v, { delay: 0.15 + i * 0.07 });
        break;
      case 'page':
        this.noise(0.35, 0.18 * v, { type: 'bandpass', freq: 3200, freqEnd: 1800, q: 0.8, attack: 0.05 });
        this.tone(660, 0.5, 'sine', 0.08 * v, { delay: 0.1, slide: 990 });
        break;
      case 'egg':
        for (let i = 0; i < 4; i++) this.tone(523 * Math.pow(1.26, i), 0.35, 'sine', 0.16 * v, { delay: i * 0.09 });
        this.tone(1046, 0.8, 'triangle', 0.08 * v, { delay: 0.36 });
        break;
      case 'crystalBreak':
        this.noise(0.3, 0.35 * v, { type: 'highpass', freq: 3000 });
        for (let i = 0; i < 4; i++) this.tone(1800 + Math.random() * 2400, 0.25, 'sine', 0.08, { delay: i * 0.03 });
        break;
      case 'fireBurst':
        this.noise(0.5, 0.5 * v, { type: 'lowpass', freq: 1800, freqEnd: 200, attack: 0.02 });
        this.tone(70, 0.4, 'sawtooth', 0.15 * v, { slide: 40, filter: 400 });
        break;
      case 'zap':
        this.tone(1200 * p, 0.12, 'sawtooth', 0.12 * v, { slide: 300, filter: 4000 });
        this.noise(0.1, 0.25 * v, { type: 'highpass', freq: 3500 });
        break;
      case 'iceCrack':
        this.noise(0.15, 0.3 * v, { type: 'highpass', freq: 4000 });
        this.tone(2400 * p, 0.2, 'sine', 0.1 * v, { slide: 1800 });
        break;
      case 'shatter':
        this.noise(0.5, 0.45 * v, { type: 'highpass', freq: 2500, freqEnd: 6000 });
        for (let i = 0; i < 6; i++) this.tone(2000 + Math.random() * 3000, 0.3, 'sine', 0.07, { delay: i * 0.025 });
        this.tone(160, 0.3, 'sine', 0.4, { slide: 50 });
        break;
      case 'thunder':
        // A sharp crack, then a long roll that darkens as it fades.
        this.noise(0.25, 0.25 * v, { type: 'highpass', freq: 1800, freqEnd: 500 });
        this.noise(3.2, 0.55 * v, { type: 'lowpass', freq: 700 * p, freqEnd: 45, attack: 0.08 });
        this.noise(2.2, 0.35 * v, { type: 'lowpass', freq: 260, freqEnd: 40, attack: 0.4, delay: 0.5 });
        this.tone(42, 2.4, 'sine', 0.35 * v, { slide: 28, attack: 0.1 });
        break;
      case 'rumble':
        this.noise(0.6, 0.5 * v, { type: 'lowpass', freq: 300, freqEnd: 80, attack: 0.02 });
        this.tone(55, 0.5, 'sine', 0.5 * v, { slide: 35 });
        break;
      case 'explosion':
        this.noise(0.8, 0.7 * v, { type: 'lowpass', freq: 2500, freqEnd: 90 });
        this.tone(80, 0.6, 'sine', 0.7 * v, { slide: 30 });
        break;
      case 'steam':
        this.noise(0.7, 0.4 * v, { type: 'highpass', freq: 2000, freqEnd: 800, attack: 0.02 });
        break;
      case 'pound':
        this.tone(70, 0.4, 'sine', 0.8 * v, { slide: 30 });
        this.noise(0.35, 0.5 * v, { type: 'lowpass', freq: 900, freqEnd: 100 });
        break;
      case 'charge':
        this.noise(0.3, 0.3 * v, { type: 'bandpass', freq: 300, freqEnd: 900, q: 2, attack: 0.05 });
        break;
      case 'enemyAlert':
        this.tone(300 * p, 0.2, 'square', 0.1 * v, { slide: 520, filter: 1500 });
        break;
      case 'enemyAttack':
        this.tone(220 * p, 0.25, 'sawtooth', 0.12 * v, { slide: 140, filter: 1200 });
        break;
      case 'enemyHurt':
        this.tone(420 * p, 0.12, 'square', 0.08 * v, { slide: 250, filter: 1800 });
        break;
      case 'enemyDie':
        this.tone(300 * p, 0.5, 'sawtooth', 0.12 * v, { slide: 60, filter: 1200 });
        this.noise(0.5, 0.25 * v, { type: 'bandpass', freq: 600, freqEnd: 200 });
        break;
      case 'shieldBlock':
        this.tone(900 * p, 0.2, 'square', 0.12 * v, { slide: 700, filter: 3000 });
        this.tone(1350 * p, 0.25, 'triangle', 0.1 * v);
        this.noise(0.06, 0.25 * v, { type: 'highpass', freq: 3000 });
        break;
      case 'bossRoar':
        this.tone(90 * p, 1.2, 'sawtooth', 0.35 * v, { slide: 55, filter: 700, attack: 0.1 });
        this.tone(93 * p, 1.2, 'sawtooth', 0.3 * v, { slide: 50, filter: 500, attack: 0.1 });
        this.noise(1.1, 0.35 * v, { type: 'bandpass', freq: 400, freqEnd: 200, q: 1.5, attack: 0.1 });
        break;
      case 'hurt':
        this.tone(330, 0.2, 'triangle', 0.3 * v, { slide: 180 });
        this.noise(0.1, 0.2 * v, { type: 'lowpass', freq: 1500 });
        break;
      case 'death':
        [0, -3, -7, -12].forEach((s, i) => this.tone(semis(12 + s), 0.5, 'triangle', 0.2, { delay: i * 0.15 }));
        break;
      case 'ui':
        this.tone(880, 0.06, 'triangle', 0.12 * v);
        break;
      case 'uiConfirm':
        this.tone(660, 0.08, 'triangle', 0.14 * v);
        this.tone(990, 0.12, 'triangle', 0.14 * v, { delay: 0.06 });
        break;
      case 'uiBack':
        this.tone(660, 0.08, 'triangle', 0.12 * v);
        this.tone(440, 0.12, 'triangle', 0.12 * v, { delay: 0.06 });
        break;
      case 'checkpoint':
        [0, 7, 12, 16].forEach((s, i) => this.tone(semis(12 + s), 0.6, 'sine', 0.16, { delay: i * 0.08 }));
        break;
      case 'levelUp':
      case 'unlock':
        [0, 4, 7, 12, 16, 19].forEach((s, i) => this.tone(semis(12 + s), 0.7, 'triangle', 0.15, { delay: i * 0.07 }));
        break;
      case 'fury':
        this.tone(55, 2, 'sawtooth', 0.3, { slide: 220, filter: 1500, attack: 0.3 });
        this.noise(2, 0.4, { type: 'bandpass', freq: 200, freqEnd: 3000, q: 0.8, attack: 0.5 });
        break;
      case 'dragonTimeOn':
        this.tone(440, 0.5, 'sine', 0.2, { slide: 110 });
        this.noise(0.5, 0.15, { type: 'lowpass', freq: 3000, freqEnd: 300 });
        break;
      case 'dragonTimeOff':
        this.tone(110, 0.3, 'sine', 0.2, { slide: 440 });
        break;
      case 'door':
        this.noise(1.0, 0.35, { type: 'lowpass', freq: 400, freqEnd: 120, attack: 0.1 });
        this.tone(60, 0.9, 'sine', 0.3, { slide: 45, attack: 0.1 });
        break;
      case 'torch':
        this.noise(0.4, 0.35, { type: 'lowpass', freq: 2500, freqEnd: 600, attack: 0.02 });
        this.tone(330, 0.3, 'triangle', 0.1, { slide: 660 });
        break;
      case 'switch':
        this.tone(520, 0.1, 'square', 0.1, { filter: 2000 });
        this.tone(780, 0.14, 'square', 0.1, { delay: 0.08, filter: 2000 });
        break;
      case 'splash':
        this.noise(0.5, 0.4, { type: 'lowpass', freq: 1800, freqEnd: 300 });
        break;
      case 'cue':
        this.tone(2093, 0.12, 'sine', 0.16 * v);
        this.tone(3136, 0.1, 'sine', 0.08 * v, { delay: 0.02 });
        break;
      case 'talk':
        this.tone(500 + Math.random() * 200, 0.04, 'triangle', 0.05 * v);
        break;
    }
  }

  // ---- loops (breath, glide wind) ---------------------------------------------

  startLoop(id: LoopId, kind: 'fire' | 'lightning' | 'ice' | 'earth' | 'wind' | 'charge' | 'rain'): void {
    const c = this.ctx;
    if (!c) return;
    this.stopLoop(id);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    const g = c.createGain();
    g.gain.value = 0.0001;
    let extra: OscillatorNode | undefined;
    switch (kind) {
      case 'fire':
        f.type = 'lowpass';
        f.frequency.value = 1300;
        g.gain.setTargetAtTime(0.35, c.currentTime, 0.05);
        break;
      case 'lightning':
        f.type = 'highpass';
        f.frequency.value = 2500;
        g.gain.setTargetAtTime(0.18, c.currentTime, 0.03);
        extra = c.createOscillator();
        extra.type = 'sawtooth';
        extra.frequency.value = 110;
        break;
      case 'ice':
        f.type = 'bandpass';
        f.frequency.value = 5200;
        f.Q.value = 2;
        g.gain.setTargetAtTime(0.28, c.currentTime, 0.05);
        break;
      case 'earth':
        f.type = 'lowpass';
        f.frequency.value = 420;
        g.gain.setTargetAtTime(0.5, c.currentTime, 0.05);
        break;
      case 'wind':
        f.type = 'bandpass';
        f.frequency.value = 600;
        f.Q.value = 0.6;
        g.gain.setTargetAtTime(0.14, c.currentTime, 0.2);
        break;
      case 'charge':
        f.type = 'bandpass';
        f.frequency.value = 350;
        f.Q.value = 1.5;
        g.gain.setTargetAtTime(0.22, c.currentTime, 0.1);
        break;
      case 'rain':
        f.type = 'highpass';
        f.frequency.value = 1400;
        f.Q.value = 0.4;
        g.gain.setTargetAtTime(0.07, c.currentTime, 1.2);
        break;
    }
    src.connect(f).connect(g).connect(this.sfxBus);
    if (extra) {
      const eg = c.createGain();
      eg.gain.value = 0.06;
      extra.connect(eg).connect(g);
      extra.start();
    }
    src.start(0, Math.random());
    this.loops.set(id, { src, gain: g, filter: f, ...(extra ? { extra } : {}) });
  }

  startLoopOnce(id: LoopId, kind: 'fire' | 'lightning' | 'ice' | 'earth' | 'wind' | 'charge' | 'rain'): void {
    if (!this.loops.has(id)) this.startLoop(id, kind);
  }

  /** Modulates a running loop, e.g. glide wind with speed. */
  tuneLoop(id: LoopId, freq: number, vol: number): void {
    const l = this.loops.get(id);
    if (!l || !this.ctx) return;
    l.filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    l.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
  }

  stopLoop(id: LoopId): void {
    const l = this.loops.get(id);
    if (!l || !this.ctx) return;
    const t = this.ctx.currentTime;
    l.gain.gain.setTargetAtTime(0.0001, t, 0.05);
    l.src.stop(t + 0.3);
    l.extra?.stop(t + 0.3);
    this.loops.delete(id);
  }

  stopAllLoops(): void {
    for (const id of [...this.loops.keys()]) this.stopLoop(id);
  }

  // ---- music ------------------------------------------------------------------

  setMusic(theme: MusicTheme | null): void {
    this.theme = theme;
    this.step = 0;
    if (!this.ctx) return;
    if (theme) this.startScheduler();
  }

  /** 0..1, how much of the combat layer to mix in. */
  setCombat(level: number): void {
    this.combat = level;
    if (!this.ctx) return;
    this.combatBus.gain.setTargetAtTime(level * 0.9, this.ctx.currentTime, 0.8);
    this.exploreBus.gain.setTargetAtTime(1 - level * 0.35, this.ctx.currentTime, 0.8);
  }

  private startScheduler(): void {
    if (!this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    if (this.schedTimer !== null) return;
    this.schedTimer = window.setInterval(() => this.schedule(), 50);
  }

  private schedule(): void {
    const c = this.ctx;
    const th = this.theme;
    if (!c || !th) return;
    const sixteenth = 60 / th.bpm / 4;
    while (this.nextNoteTime < c.currentTime + 0.2) {
      this.playStep(th, this.step, this.nextNoteTime, sixteenth);
      this.nextNoteTime += sixteenth;
      this.step++;
    }
  }

  private playStep(th: MusicTheme, step: number, t: number, six: number): void {
    const c = this.ctx!;
    const bar = Math.floor(step / 16) % th.chords.length;
    const s = step % 16;
    const chord = th.chords[bar]!;
    const at = t - c.currentTime;
    if (at < -0.05) return;
    const delay = Math.max(0, at);
    // Pad: whole-bar chord.
    if (s === 0) {
      for (const n of chord) {
        this.tone(semis(n - 12), six * 16, th.pad, 0.045, { attack: six * 4, delay, bus: this.exploreBus, filter: th.mood === 'tense' ? 900 : 1400, detune: 6 });
        this.tone(semis(n - 12), six * 16, th.pad, 0.035, { attack: six * 4, delay, bus: this.exploreBus, filter: 1200, detune: -7 });
      }
      this.tone(semis(chord[0]! - 24), six * 16, 'sine', 0.12, { attack: 0.05, delay, bus: this.exploreBus });
    }
    // Arpeggio / melody.
    const pattern = th.mood === 'calm' ? [0, 6, 10] : th.mood === 'mysterious' ? [0, 3, 6, 11, 14] : [0, 2, 4, 6, 8, 10, 12, 14];
    if (pattern.includes(s)) {
      const idx = (step * 7 + bar * 3) % th.scale.length;
      const note = chord[0]! + th.scale[idx]!;
      const oct = s % 4 === 0 ? 12 : 24;
      this.tone(semis(note + oct - 12), six * 2.5, th.lead, 0.05, { delay, bus: this.exploreBus, filter: 2600 });
    }
    // Combat layer: drums and a driving bass.
    if (s % 4 === 0) this.kick(delay);
    if (s === 4 || s === 12) this.snare(delay);
    if (s % 2 === 1) this.noise(0.04, 0.05, { type: 'highpass', freq: 7000, delay, bus: this.combatBus });
    if (s % 2 === 0) this.tone(semis(chord[0]! - 24), six * 1.6, 'sawtooth', 0.07, { delay, bus: this.combatBus, filter: 500 });
    if (s === 14 && (step / 16) % 2 >= 1) this.tone(semis(chord[1]! - 12), six * 2, 'square', 0.03, { delay, bus: this.combatBus, filter: 1400 });
  }

  private kick(delay: number): void {
    this.tone(120, 0.22, 'sine', 0.35, { slide: 40, delay, bus: this.combatBus });
  }

  private snare(delay: number): void {
    this.noise(0.14, 0.18, { type: 'bandpass', freq: 1800, q: 0.7, delay, bus: this.combatBus });
    this.tone(200, 0.08, 'triangle', 0.1, { slide: 120, delay, bus: this.combatBus });
  }

  get combatLevel(): number {
    return this.combat;
  }
}

export const THEMES: Record<string, MusicTheme> = {
  fen: { bpm: 92, chords: [[0, 4, 7], [-4, 0, 3], [5, 9, 12], [-5, -1, 2]], scale: [0, 2, 4, 7, 9, 12, 14], pad: 'triangle', lead: 'sine', mood: 'calm' },
  sanctum: { bpm: 84, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], scale: [0, 3, 5, 7, 10, 12], pad: 'sine', lead: 'triangle', mood: 'mysterious' },
  falls: { bpm: 108, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: [0, 2, 4, 7, 9, 11, 12], pad: 'triangle', lead: 'triangle', mood: 'bright' },
  frost: { bpm: 96, chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], scale: [0, 2, 3, 7, 8, 12], pad: 'sine', lead: 'sine', mood: 'mysterious' },
  plains: { bpm: 112, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: [0, 2, 4, 5, 7, 9, 12], pad: 'triangle', lead: 'square', mood: 'heroic' },
  keep: { bpm: 100, chords: [[0, 3, 7], [1, 5, 8], [-2, 1, 5], [-5, -1, 2]], scale: [0, 1, 3, 6, 7, 10], pad: 'sawtooth', lead: 'triangle', mood: 'tense' },
  boss: { bpm: 132, chords: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]], scale: [0, 3, 5, 7, 10, 12], pad: 'sawtooth', lead: 'square', mood: 'tense' },
  title: { bpm: 76, chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]], scale: [0, 2, 4, 7, 9, 12], pad: 'sine', lead: 'triangle', mood: 'calm' },
};

export const audio = new Audio();
