/**
 * Piano Kids - Audio Engine Ultra Otimizado (Web Audio API)
 * Síntese acústica fiel, controle de polifonia (voice limiting) e desbloqueio iOS/Android.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.currentInstrument = 'piano'; // 'piano', 'xylophone', 'musicbox', 'meow'
    this.volume = 0.85;
    this.activeVoices = [];
    this.maxPolyphony = 12; // Limite máximo de vozes simultâneas para nunca travar no glissando
    this.unlocked = false;

    // Frequências fiéis padrão de afinação ocidental (A4 = 440Hz)
    this.frequencies = {
      'C4': 261.63,
      'C#4': 277.18,
      'D4': 293.66,
      'D#4': 311.13,
      'E4': 329.63,
      'F4': 349.23,
      'F#4': 369.99,
      'G4': 392.00,
      'G#4': 415.30,
      'A4': 440.00,
      'A#4': 466.16,
      'B4': 493.88,
      'C5': 523.25,
      'C#5': 554.37,
      'D5': 587.33,
      'D#5': 622.25,
      'E5': 659.25,
      'F5': 698.46,
      'F#5': 739.99,
      'G5': 783.99,
      'G#5': 830.61,
      'A5': 880.00,
      'B5': 987.77,
      'C6': 1046.50
    };

    // Definição de Acordes Menores (Notas sonoras e teclas visuais correspondentes no teclado)
    this.minorChords = {
      'Cm': { name: 'DÓ MENOR', notes: ['C4', 'D#4', 'G4'], visualKeys: ['C4', 'D#4', 'G4'], label: 'Cm', notesText: 'Dó + Ré# + Sol' },
      'Dm': { name: 'RÉ MENOR', notes: ['D4', 'F4', 'A4'], visualKeys: ['D4', 'F4', 'A4'], label: 'Dm', notesText: 'Ré + Fá + Lá' },
      'Em': { name: 'MI MENOR', notes: ['E4', 'G4', 'B4'], visualKeys: ['E4', 'G4', 'B4'], label: 'Em', notesText: 'Mi + Sol + Si' },
      'Fm': { name: 'FÁ MENOR', notes: ['F4', 'G#4', 'C5'], visualKeys: ['F4', 'G#4', 'C5'], label: 'Fm', notesText: 'Fá + Sol# + Dó' },
      'Gm': { name: 'SOL MENOR', notes: ['G4', 'A#4', 'D5'], visualKeys: ['G4', 'A#4', 'D4'], label: 'Gm', notesText: 'Sol + Lá# + Ré' },
      'Am': { name: 'LÁ MENOR', notes: ['A4', 'C5', 'E5'], visualKeys: ['A4', 'C5', 'E4'], label: 'Am', notesText: 'Lá + Dó + Mi' },
      'Bm': { name: 'SI MENOR', notes: ['B4', 'D5', 'F#5'], visualKeys: ['B4', 'D4', 'F#4'], label: 'Bm', notesText: 'Si + Ré + Fá#' }
    };
  }

  // Inicializa e desbloqueia o contexto de áudio (compatível com iOS Safari e Android Chrome)
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Compressor dinâmico leve para evitar estalos quando várias notas tocam juntas
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3, this.ctx.currentTime);

      // Controle de Volume Master
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    // No iOS, o estado pode ficar 'suspended' ou 'interrupted' ao minimizar o app
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }

    // Desbloqueio silencioso no primeiro toque para iOS Safari
    if (!this.unlocked && this.ctx) {
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.unlocked = true;
      } catch (e) {}
    }
  }

  // Registra uma voz ativa e descarta a mais antiga se ultrapassar o limite de polifonia
  registerVoice(gainNode, oscillators, duration) {
    const now = this.ctx.currentTime;

    // Se exceder o limite de vozes simultâneas, encerra a mais antiga suavemente
    while (this.activeVoices.length >= this.maxPolyphony) {
      const oldest = this.activeVoices.shift();
      this.stopVoiceQuickly(oldest);
    }

    const voice = { gainNode, oscillators, stopped: false };
    this.activeVoices.push(voice);

    // Limpeza automática após o término natural da nota
    setTimeout(() => {
      this.cleanupVoice(voice);
    }, duration * 1000 + 80);
  }

  stopVoiceQuickly(voice) {
    if (!voice || voice.stopped || !this.ctx) return;
    voice.stopped = true;
    try {
      const now = this.ctx.currentTime;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(Math.max(0.0001, voice.gainNode.gain.value), now);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      setTimeout(() => this.cleanupVoice(voice), 35);
    } catch (e) {
      this.cleanupVoice(voice);
    }
  }

  cleanupVoice(voice) {
    if (!voice) return;
    voice.stopped = true;
    const idx = this.activeVoices.indexOf(voice);
    if (idx !== -1) this.activeVoices.splice(idx, 1);

    try {
      voice.oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
      });
      voice.gainNode.disconnect();
    } catch (e) {}
  }

  // Toca uma nota individual
  playNote(noteName, duration = 1.6) {
    this.init();
    const freq = this.frequencies[noteName];
    if (!freq) return;

    switch (this.currentInstrument) {
      case 'xylophone':
        this.synthXylophone(freq, duration);
        break;
      case 'musicbox':
        this.synthMusicBox(freq, duration);
        break;
      case 'meow':
        this.synthMeow(freq, duration);
        break;
      case 'piano':
      default:
        this.synthPiano(freq, duration);
        break;
    }
  }

  // Síntese de Piano Acústico otimizada (2 osciladores leves)
  synthPiano(freq, duration = 1.6) {
    const now = this.ctx.currentTime;
    const gainNode = this.ctx.createGain();

    // Envelope percussivo de piano acústico: ataque instantâneo e decaimento gradual
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.85, now + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.35, now + 0.14);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Oscilador 1: Corpo da corda acústica
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Oscilador 2: Harmônico superior suave para dar o timbre do piano
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.28, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    this.registerVoice(gainNode, [osc1, osc2, osc2Gain], duration);
  }

  // Síntese de Xilofone infantil ultra rápida
  synthXylophone(freq, duration = 1.1) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    this.registerVoice(gain, [osc], duration);
  }

  // Síntese de Caixinha de Música
  synthMusicBox(freq, duration = 1.4) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    this.registerVoice(gain, [osc], duration);
  }

  // Síntese fofa de Gatinho
  synthMeow(freq, duration = 0.6) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 0.95, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + duration);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);

    this.registerVoice(gain, [osc], duration);
  }

  // Toca um Acorde Menor completo de forma rápida e harmônica
  playMinorChord(chordKey, arpeggiated = true) {
    this.init();
    const chord = this.minorChords[chordKey];
    if (!chord) return null;

    chord.notes.forEach((note, index) => {
      const delay = arpeggiated ? index * 0.035 : 0;
      setTimeout(() => {
        this.playNote(note, 1.8);
      }, delay * 1000);
    });

    return chord;
  }

  setInstrument(name) {
    this.currentInstrument = name;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
}

// Instância global de áudio
window.audioEngine = new SoundEngine();
