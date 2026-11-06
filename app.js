/**
 * Piano Kids - Aplicação Principal e Interações
 * Suporte a Android, iPhone (PWA), Multitouch, Sons Fiéis e Modo Infantil.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicialização dos Motores
  const audio = window.audioEngine;
  const particles = new ParticleEngine('particleCanvas');

  // Elementos do DOM
  const pianoKeyboard = document.getElementById('pianoKeyboard');
  const allKeys = document.querySelectorAll('.key');
  const minorCards = document.querySelectorAll('.minor-chord-card');
  const instrumentBtns = document.querySelectorAll('.inst-btn');
  const modeTabs = document.querySelectorAll('.tab-btn');
  const songsSection = document.getElementById('songsSection');
  const minorChordsSection = document.getElementById('minorChordsSection');
  const songCardsContainer = document.querySelector('.song-cards-container');
  const songGuideBar = document.getElementById('songGuideBar');
  const currentSongName = document.getElementById('currentSongName');
  const songProgressText = document.getElementById('songProgressText');
  const playSongDemoBtn = document.getElementById('playSongDemoBtn');
  const stopSongBtn = document.getElementById('stopSongBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const muteBtn = document.getElementById('muteBtn');
  const toggleFxBtn = document.getElementById('toggleFxBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const installAppBtn = document.getElementById('installAppBtn');
  const installModal = document.getElementById('installModal');
  const closeInstallModal = document.getElementById('closeInstallModal');
  const confirmInstallBtn = document.getElementById('confirmInstallBtn');
  const iosInstallGuide = document.getElementById('iosInstallGuide');
  const androidInstallGuide = document.getElementById('androidInstallGuide');
  const congratsModal = document.getElementById('congratsModal');
  const congratsCloseBtn = document.getElementById('congratsCloseBtn');

  let deferredInstallPrompt = null;
  let isMuted = false;
  let lastVolume = 0.85;

  // Mapa de notas para elementos do teclado
  const keyElementMap = {};
  allKeys.forEach(k => {
    const note = k.dataset.note;
    if (note) keyElementMap[note] = k;
  });

  /* ==========================================================================
     1. SISTEMA DE TOQUE E SOM DAS TECLAS (MULTITOUCH PARA CELULAR)
     ========================================================================== */

  // Toca uma nota específica com animação visual e partículas
  function triggerKey(keyEl, x = null, y = null) {
    if (!keyEl) return;
    const note = keyEl.dataset.note;
    if (!note) return;

    // Desbloqueia áudio se necessário
    audio.init();

    // Toca o som fiel
    audio.playNote(note);

    // Efeito tátil (vibração no celular se suportado)
    if (navigator.vibrate) {
      try { navigator.vibrate(18); } catch (e) {}
    }

    // Animação visual da tecla afundando
    keyEl.classList.add('active');
    setTimeout(() => {
      keyEl.classList.remove('active');
    }, 220);

    // Explosão de estrelas e notas musicais coloridas
    const rect = keyEl.getBoundingClientRect();
    const spawnX = x !== null ? x : rect.left + rect.width / 2;
    const spawnY = y !== null ? y : rect.top + rect.height * 0.7;
    const color = keyEl.dataset.color || '#ffe600';
    particles.spawn(spawnX, spawnY, color);

    // Notifica o guia de música caso esteja no modo aprendizado
    songGuide.onUserPlayedNote(note);
  }

  // Tratamento de eventos de toque e ponteiro com suporte a multitouch real
  allKeys.forEach(key => {
    // Configura a cor da tecla no CSS
    const color = key.dataset.color;
    if (color) {
      key.style.setProperty('--key-color', color);
    }

    // Eventos Pointer (unifica Mouse e Touch moderno)
    key.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerKey(key, e.clientX, e.clientY);
    });
  });

  /* ==========================================================================
     2. NOTAS E ACORDES MENORES (DÓ MENOR, RÉ MENOR, ETC.)
     ========================================================================== */

  minorCards.forEach(card => {
    const chordId = card.dataset.chord;

    card.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.init();

      // Toca o acorde menor com arpejo realista
      const chord = audio.playMinorChord(chordId, true);

      // Vibração no celular
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch (e) {}
      }

      // Animação visual no card do acorde menor
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 350);

      // Partículas coloridas leves apenas no card clicado
      const rect = card.getBoundingClientRect();
      particles.spawn(e.clientX || (rect.left + rect.width / 2), e.clientY || (rect.top + rect.height / 2), '#ff007f');

      // Ilumina simultaneamente no piano as teclas que compõem o acorde menor (sem spawn excessivo)
      if (chord && chord.notes) {
        chord.notes.forEach((noteName, idx) => {
          const keyEl = keyElementMap[noteName];
          if (keyEl) {
            setTimeout(() => {
              keyEl.classList.add('active');
              setTimeout(() => keyEl.classList.remove('active'), 250);
            }, idx * 45);
          }
        });
      }
    });
  });

  /* ==========================================================================
     3. TECLADO DO COMPUTADOR (ACESSIBILIDADE / PC)
     ========================================================================== */
  const keyboardMapping = {
    // Teclas Brancas
    'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
    'A': 'C4', 'S': 'D4', 'D': 'E4', 'F': 'F4', 'G': 'G4', 'H': 'A4', 'J': 'B4', 'K': 'C5',
    // Teclas Pretas
    'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4',
    'W': 'C#4', 'E': 'D#4', 'T': 'F#4', 'Y': 'G#4', 'U': 'A#4',
    // Acordes menores (1 a 7)
    '1': 'chord:Cm', '2': 'chord:Dm', '3': 'chord:Em', '4': 'chord:Fm',
    '5': 'chord:Gm', '6': 'chord:Am', '7': 'chord:Bm'
  };

  const activeKeysPressed = new Set();
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const action = keyboardMapping[e.key];
    if (!action) return;

    if (action.startsWith('chord:')) {
      const chordId = action.split(':')[1];
      const card = document.querySelector(`.minor-chord-card[data-chord="${chordId}"]`);
      if (card) {
        card.dispatchEvent(new Event('pointerdown'));
      }
    } else {
      const keyEl = keyElementMap[action];
      if (keyEl && !activeKeysPressed.has(e.key)) {
        activeKeysPressed.add(e.key);
        triggerKey(keyEl);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    activeKeysPressed.delete(e.key);
  });

  /* ==========================================================================
     4. MODO CANÇÕES INFANTIS E GUIA INTERATIVO
     ========================================================================== */

  const songGuide = new SongGuide(
    // Callback de iluminação da tecla guia
    (noteName, label, index, total) => {
      // Remove destaque anterior
      allKeys.forEach(k => k.classList.remove('guide-highlight'));

      if (!noteName) return;

      const targetKey = keyElementMap[noteName];
      if (targetKey) {
        targetKey.classList.add('guide-highlight');
      }

      if (songProgressText) {
        songProgressText.textContent = `${index + 1} / ${total} (Toque: ${label})`;
      }
    },
    // Callback quando a canção é concluída
    (completedSong) => {
      if (congratsModal) {
        congratsModal.classList.remove('hidden');
        // Efeito comemorativo leve
        for (let i = 0; i < 6; i++) {
          particles.spawn(
            window.innerWidth * (0.3 + Math.random() * 0.4),
            window.innerHeight * (0.4 + Math.random() * 0.2)
          );
        }
      }
    }
  );

  // Renderiza cards de músicas disponíveis
  function renderSongCards() {
    songCardsContainer.innerHTML = '';
    KIDS_SONGS.forEach(song => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <span class="song-card-icon">${song.icon}</span>
        <div class="song-card-title">${song.name}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.song-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        startSongPractice(song.id);
      });
      songCardsContainer.appendChild(card);
    });
  }

  function startSongPractice(songId) {
    const song = KIDS_SONGS.find(s => s.id === songId);
    if (!song) return;

    songGuideBar.classList.remove('hidden');
    currentSongName.textContent = `${song.icon} ${song.name}`;
    songGuide.startSong(songId);
  }

  if (playSongDemoBtn) {
    playSongDemoBtn.addEventListener('click', () => {
      if (!songGuide.currentSong) return;
      songGuide.playDemo(songGuide.currentSong.id, (note, label) => {
        const keyEl = keyElementMap[note];
        if (keyEl) triggerKey(keyEl);
      });
    });
  }

  if (stopSongBtn) {
    stopSongBtn.addEventListener('click', () => {
      songGuide.stopSong();
      songGuideBar.classList.add('hidden');
      document.querySelectorAll('.song-card').forEach(c => c.classList.remove('selected'));
    });
  }

  if (congratsCloseBtn) {
    congratsCloseBtn.addEventListener('click', () => {
      congratsModal.classList.add('hidden');
    });
  }

  renderSongCards();

  /* ==========================================================================
     5. ABAS DE NAVEGAÇÃO E VISUALIZAÇÃO
     ========================================================================== */

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;

      if (target === 'piano-view') {
        songsSection.classList.add('hidden');
        minorChordsSection.classList.remove('hidden');
      } else if (target === 'minor-view') {
        songsSection.classList.add('hidden');
        minorChordsSection.classList.remove('hidden');
        // Rola suavemente até o bloco de acordes
        minorChordsSection.scrollIntoView({ behavior: 'smooth' });
      } else if (target === 'songs-view') {
        minorChordsSection.classList.add('hidden');
        songsSection.classList.remove('hidden');
      }
    });
  });

  /* ==========================================================================
     6. INSTRUMENTOS E VOLUME
     ========================================================================== */

  instrumentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      instrumentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const inst = btn.dataset.instrument;
      audio.setInstrument(inst);

      // Toca uma nota de demonstração rápida
      audio.playNote('C5', 0.6);
    });
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      audio.setVolume(vol);
      lastVolume = vol;
      if (vol === 0) {
        muteBtn.textContent = '🔇';
        isMuted = true;
      } else {
        muteBtn.textContent = '🔊';
        isMuted = false;
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (isMuted) {
        audio.setVolume(lastVolume || 0.85);
        volumeSlider.value = lastVolume || 0.85;
        muteBtn.textContent = '🔊';
        isMuted = false;
      } else {
        audio.setVolume(0);
        volumeSlider.value = 0;
        muteBtn.textContent = '🔇';
        isMuted = true;
      }
    });
  }

  /* ==========================================================================
     7. EFEITOS VISUAIS E TELA CHEIA
     ========================================================================== */

  if (toggleFxBtn) {
    toggleFxBtn.addEventListener('click', () => {
      const isEnabled = !particles.enabled;
      particles.setEnabled(isEnabled);
      if (isEnabled) {
        toggleFxBtn.textContent = '✨';
        toggleFxBtn.classList.add('active');
        toggleFxBtn.title = 'Estrelinhas: Ligadas';
      } else {
        toggleFxBtn.textContent = '💤';
        toggleFxBtn.classList.remove('active');
        toggleFxBtn.title = 'Estrelinhas: Desligadas';
      }
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        fullscreenBtn.textContent = '✕';
      } else {
        document.exitFullscreen?.().catch(() => {});
        fullscreenBtn.textContent = '⛶';
      }
    });
  }

  /* ==========================================================================
     8. PWA: INSTALAÇÃO E ATALHO NO CELULAR (IPHONE & ANDROID)
     ========================================================================== */

  // Detecção de plataforma iOS (iPhone / iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  // Se já estiver rodando instalado em tela cheia, esconde o botão de instalar
  if (isStandalone && installAppBtn) {
    installAppBtn.style.display = 'none';
  }

  // Captura o evento nativo de instalação do Android / Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installAppBtn) installAppBtn.style.display = 'flex';
  });

  // Clique no botão "Instalar no Celular"
  if (installAppBtn) {
    installAppBtn.addEventListener('click', () => {
      if (isIOS) {
        // Mostra o guia ilustrado com os 3 passos para iPhone/Safari
        iosInstallGuide.classList.remove('hidden');
        androidInstallGuide.classList.add('hidden');
        installModal.classList.remove('hidden');
      } else if (deferredInstallPrompt) {
        // Android nativo: abre o prompt do sistema direto
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            installAppBtn.style.display = 'none';
          }
          deferredInstallPrompt = null;
        });
      } else {
        // Fallback genérico para navegadores que suportam PWA manual
        iosInstallGuide.classList.add('hidden');
        androidInstallGuide.classList.remove('hidden');
        installModal.classList.remove('hidden');
      }
    });
  }

  if (confirmInstallBtn) {
    confirmInstallBtn.addEventListener('click', () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => {
          deferredInstallPrompt = null;
          installModal.classList.add('hidden');
        });
      } else {
        alert('Para adicionar o atalho: clique nos três pontinhos do navegador e escolha "Adicionar à Tela Inicial" ou "Instalar Aplicativo".');
        installModal.classList.add('hidden');
      }
    });
  }

  if (closeInstallModal) {
    closeInstallModal.addEventListener('click', () => {
      installModal.classList.add('hidden');
    });
  }

  // Registra o Service Worker para cache e uso offline total
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('Piano Kids PWA pronto e registrado com sucesso!', reg.scope);
        })
        .catch(err => {
          console.warn('Registro de Service Worker falhou:', err);
        });
    });
  }
});
