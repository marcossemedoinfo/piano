/**
 * Piano Kids - Canções Infantis Interativas
 * Músicas fáceis para crianças aprenderem tocando nas teclas iluminadas.
 */

const KIDS_SONGS = [
  {
    id: 'brilha-brilha',
    name: 'Brilha, Brilha, Estrelinha',
    icon: '⭐',
    notes: [
      { note: 'C4', label: 'DÓ' }, { note: 'C4', label: 'DÓ' },
      { note: 'G4', label: 'SOL' }, { note: 'G4', label: 'SOL' },
      { note: 'A4', label: 'LÁ' }, { note: 'A4', label: 'LÁ' },
      { note: 'G4', label: 'SOL', duration: 1.5 },
      { note: 'F4', label: 'FÁ' }, { note: 'F4', label: 'FÁ' },
      { note: 'E4', label: 'MI' }, { note: 'E4', label: 'MI' },
      { note: 'D4', label: 'RÉ' }, { note: 'D4', label: 'RÉ' },
      { note: 'C4', label: 'DÓ', duration: 2.0 }
    ]
  },
  {
    id: 'cai-cai-balao',
    name: 'Cai, Cai, Balão',
    icon: '🎈',
    notes: [
      { note: 'G4', label: 'SOL' }, { note: 'G4', label: 'SOL' },
      { note: 'F4', label: 'FÁ' }, { note: 'E4', label: 'MI', duration: 1.2 },
      { note: 'G4', label: 'SOL' }, { note: 'G4', label: 'SOL' },
      { note: 'F4', label: 'FÁ' }, { note: 'E4', label: 'MI', duration: 1.2 },
      { note: 'G4', label: 'SOL' }, { note: 'A4', label: 'LÁ' },
      { note: 'G4', label: 'SOL' }, { note: 'F4', label: 'FÁ' },
      { note: 'E4', label: 'MI' }, { note: 'D4', label: 'RÉ', duration: 1.5 },
      { note: 'D4', label: 'RÉ' }, { note: 'E4', label: 'MI' },
      { note: 'F4', label: 'FÁ' }, { note: 'D4', label: 'RÉ' },
      { note: 'E4', label: 'MI' }, { note: 'F4', label: 'FÁ' },
      { note: 'G4', label: 'SOL', duration: 1.4 },
      { note: 'G4', label: 'SOL' }, { note: 'A4', label: 'LÁ' },
      { note: 'G4', label: 'SOL' }, { note: 'F4', label: 'FÁ' },
      { note: 'E4', label: 'MI' }, { note: 'D4', label: 'RÉ' },
      { note: 'C4', label: 'DÓ', duration: 2.0 }
    ]
  },
  {
    id: 'parabens',
    name: 'Parabéns Pra Você',
    icon: '🎂',
    notes: [
      { note: 'C4', label: 'DÓ' }, { note: 'C4', label: 'DÓ' },
      { note: 'D4', label: 'RÉ' }, { note: 'C4', label: 'DÓ' },
      { note: 'F4', label: 'FÁ' }, { note: 'E4', label: 'MI', duration: 1.5 },
      { note: 'C4', label: 'DÓ' }, { note: 'C4', label: 'DÓ' },
      { note: 'D4', label: 'RÉ' }, { note: 'C4', label: 'DÓ' },
      { note: 'G4', label: 'SOL' }, { note: 'F4', label: 'FÁ', duration: 2.0 }
    ]
  },
  {
    id: 'do-re-mi',
    name: 'Dó-Ré-Mi-Fá',
    icon: '🎶',
    notes: [
      { note: 'C4', label: 'DÓ' }, { note: 'D4', label: 'RÉ' },
      { note: 'E4', label: 'MI' }, { note: 'F4', label: 'FÁ', duration: 1.2 },
      { note: 'F4', label: 'FÁ' }, { note: 'F4', label: 'FÁ' },
      { note: 'C4', label: 'DÓ' }, { note: 'D4', label: 'RÉ' },
      { note: 'C4', label: 'DÓ' }, { note: 'D4', label: 'RÉ', duration: 1.2 },
      { note: 'D4', label: 'RÉ' }, { note: 'D4', label: 'RÉ' },
      { note: 'C4', label: 'DÓ' }, { note: 'G4', label: 'SOL' },
      { note: 'F4', label: 'FÁ' }, { note: 'E4', label: 'MI', duration: 1.2 },
      { note: 'E4', label: 'MI' }, { note: 'E4', label: 'MI' }
    ]
  },
  {
    id: 'ciranda',
    name: 'Ciranda, Cirandinha',
    icon: '🎡',
    notes: [
      { note: 'C4', label: 'DÓ' }, { note: 'D4', label: 'RÉ' }, { note: 'E4', label: 'MI' },
      { note: 'F4', label: 'FÁ' }, { note: 'G4', label: 'SOL' }, { note: 'A4', label: 'LÁ' },
      { note: 'G4', label: 'SOL' }, { note: 'F4', label: 'FÁ' }, { note: 'E4', label: 'MI' },
      { note: 'D4', label: 'RÉ' }, { note: 'C4', label: 'DÓ', duration: 2.0 }
    ]
  }
];

class SongGuide {
  constructor(onKeyHighlight, onSongComplete) {
    this.currentSong = null;
    this.currentIndex = 0;
    this.isPlayingDemo = false;
    this.demoTimeouts = [];
    this.onKeyHighlight = onKeyHighlight;
    this.onSongComplete = onSongComplete;
  }

  startSong(songId) {
    this.stopDemo();
    const song = KIDS_SONGS.find(s => s.id === songId);
    if (!song) return;

    this.currentSong = song;
    this.currentIndex = 0;
    this.highlightCurrentStep();
  }

  stopSong() {
    this.stopDemo();
    this.currentSong = null;
    this.currentIndex = 0;
    if (this.onKeyHighlight) {
      this.onKeyHighlight(null);
    }
  }

  highlightCurrentStep() {
    if (!this.currentSong) return;

    if (this.currentIndex >= this.currentSong.notes.length) {
      const completed = this.currentSong;
      // Reinicia para o começo da música para que a criança possa tocar de novo se quiser
      this.currentIndex = 0;
      this.highlightCurrentStep();
      if (this.onSongComplete) this.onSongComplete(completed);
      return;
    }

    const currentStep = this.currentSong.notes[this.currentIndex];
    if (this.onKeyHighlight) {
      this.onKeyHighlight(currentStep.note, currentStep.label, this.currentIndex, this.currentSong.notes.length);
    }
  }

  onUserPlayedNote(noteName) {
    if (!this.currentSong || this.isPlayingDemo) return false;

    const expected = this.currentSong.notes[this.currentIndex];
    if (expected && expected.note === noteName) {
      this.currentIndex++;
      this.highlightCurrentStep();
      return true;
    }
    return false;
  }

  playDemo(songId, onPlayStep, onDemoStateChange) {
    // Se já estiver tocando a demo, para a demonstração e volta para o modo prática
    if (this.isPlayingDemo) {
      this.stopDemo();
      if (onDemoStateChange) onDemoStateChange(false);
      this.highlightCurrentStep();
      return;
    }

    const song = KIDS_SONGS.find(s => s.id === songId);
    if (!song) return;

    this.stopDemo();
    this.isPlayingDemo = true;
    this.currentSong = song;
    if (onDemoStateChange) onDemoStateChange(true);

    let accumulatedTime = 80;

    song.notes.forEach((step, index) => {
      const stepDuration = (step.duration || 0.6) * 580;
      const tid = setTimeout(() => {
        if (!this.isPlayingDemo) return;
        this.currentIndex = index;
        if (this.onKeyHighlight) {
          this.onKeyHighlight(step.note, step.label, index, song.notes.length);
        }
        if (onPlayStep) onPlayStep(step.note, step.label);

        if (index === song.notes.length - 1) {
          const endTid = setTimeout(() => {
            this.isPlayingDemo = false;
            this.currentIndex = 0;
            if (onDemoStateChange) onDemoStateChange(false);
            this.highlightCurrentStep();
          }, 700);
          this.demoTimeouts.push(endTid);
        }
      }, accumulatedTime);

      this.demoTimeouts.push(tid);
      accumulatedTime += stepDuration;
    });
  }

  stopDemo() {
    this.isPlayingDemo = false;
    this.demoTimeouts.forEach(tid => clearTimeout(tid));
    this.demoTimeouts = [];
  }
}
