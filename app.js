/**
 * Piano Kids - Aplicação Principal e Interações
 * Suporte a Android, iPhone (PWA), Multitouch, Glissando, Sons Fiéis e Modo Infantil.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicialização dos Motores
  const audio = window.audioEngine;
  const particles = new ParticleEngine('particleCanvas');

  // Elementos do DOM
  const pianoKeyboard = document.getElementById('pianoKeyboard');
  const minorCardsGrid = document.querySelector('.minor-cards-grid');
  const allKeys = document.querySelectorAll('.key');
  const minorCards = document.querySelectorAll('.minor-chord-card');
  const instrumentBtns = document.querySelectorAll('.inst-btn');
  const modeTabs = document.querySelectorAll('.tab-btn');
  const instructionBanner = document.getElementById('instructionBanner');
  const bannerEmoji = instructionBanner ? instructionBanner.querySelector('.banner-emoji') : null;
  const bannerText = instructionBanner ? instructionBanner.querySelector('.banner-text') : null;
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

  // Atualiza a mensagem educativa no banner superior
  function updateBanner(emoji, text) {
    if (bannerEmoji) bannerEmoji.textContent = emoji;
    if (bannerText) bannerText.textContent = text;
  }

  /* ==========================================================================
     1. SISTEMA DE TOQUE E SOM DAS TECLAS (MULTITOUCH & GLISSANDO / ARRASTAR)
     ========================================================================== */

  // Mapa de ponteiros ativos (pointerId -> elemento .key ou .minor-chord-card)
  const activePointers = new Map();

  // Toca uma nota específica com animação visual e partículas
  function triggerKey(keyEl, x = null, y = null, autoReleaseMs = 0) {
    if (!keyEl) return;
    const note = keyEl.dataset.note;
    if (!note) return;

    // Desbloqueia áudio se necessário
    audio.init();

    // Toca o som fiel
    audio.playNote(note);

    // Efeito tátil (vibração no celular se suportado)
    if (navigator.vibrate) {
      try { navigator.vibrate(15); } catch (e) {}
    }

    // Animação visual da tecla afundando
    keyEl.classList.add('active');
    if (autoReleaseMs > 0) {
      setTimeout(() => {
        keyEl.classList.remove('active');
      }, autoReleaseMs);
    }

    // Mostra no banner qual nota foi tocada
    const solfege = keyEl.dataset.solfege || note;
    const mascotEl = keyEl.querySelector('.key-mascot');
    const emoji = mascotEl ? mascotEl.textContent : '🎵';
    if (!songGuide.currentSong) {
      updateBanner(emoji, `Tocando nota: ${solfege} (${note.replace('4', '')})`);
    }

    // Explosão de estrelas leves e coloridas
    const rect = keyEl.getBoundingClientRect();
    const spawnX = x !== null ? x : rect.left + rect.width / 2;
    const spawnY = y !== null ? y : rect.top + rect.height * 0.7;
    const color = keyEl.dataset.color || '#ffe600';
    particles.spawn(spawnX, spawnY, color);

    // Notifica o guia de música caso esteja no modo aprendizado
    songGuide.onUserPlayedNote(note);
  }

  // Toca um acorde menor e ilumina as 3 teclas correspondentes no piano
  function triggerMinorChordCard(card, x = null, y = null) {
    if (!card) return;
    const chordId = card.dataset.chord;
    if (!chordId) return;

    audio.init();
    const chord = audio.playMinorChord(chordId, true);

    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (e) {}
    }

    card.classList.add('active');
    setTimeout(() => card.classList.remove('active'), 320);

    const mascotEl = card.querySelector('.card-mascot');
    const emoji = mascotEl ? mascotEl.textContent : '🌈';
    if (chord && !songGuide.currentSong) {
      updateBanner(emoji, `Acorde ${chord.name} (${chord.label}): ${chord.notesText}`);
    }

    const rect = card.getBoundingClientRect();
    particles.spawn(x || (rect.left + rect.width / 2), y || (rect.top + rect.height / 2), '#ff007f');

    // Ilumina no piano todas as 3 teclas que formam o acorde menor
    const keysToLight = (chord && chord.visualKeys) ? chord.visualKeys : (chord ? chord.notes : []);
    keysToLight.forEach((noteName, idx) => {
      const keyEl = keyElementMap[noteName];
      if (keyEl) {
        setTimeout(() => {
          keyEl.classList.add('active');
          setTimeout(() => keyEl.classList.remove('active'), 280);
        }, idx * 35);
      }
    });
  }

  // Detecta qual tecla (.key) ou card menor (.minor-chord-card) está sob o dedo
  function getInteractiveTargetFromCoords(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') return null;
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return el.closest('.key, .minor-chord-card');
  }

  function handlePointerStart(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Libera captura de ponteiro para permitir arrastar livremente entre teclas e acordes
    if (e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    const targetEl = getInteractiveTargetFromCoords(e.clientX, e.clientY);
    if (targetEl) {
      e.preventDefault();
      activePointers.set(e.pointerId, targetEl);
      if (targetEl.classList.contains('key')) {
        triggerKey(targetEl, e.clientX, e.clientY);
      } else if (targetEl.classList.contains('minor-chord-card')) {
        triggerMinorChordCard(targetEl, e.clientX, e.clientY);
      }
    }
  }

  function handlePointerMove(e) {
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      if (activePointers.has(e.pointerId)) {
        const prev = activePointers.get(e.pointerId);
        if (prev) prev.classList.remove('active');
        activePointers.delete(e.pointerId);
      }
      return;
    }

    if (!activePointers.has(e.pointerId) && e.buttons === 0) return;

    const currentTarget = getInteractiveTargetFromCoords(e.clientX, e.clientY);
    const prevTarget = activePointers.get(e.pointerId);

    // Se deslizou para outra tecla ou outro card de acorde (Glissando)
    if (currentTarget !== prevTarget) {
      if (prevTarget) {
        prevTarget.classList.remove('active');
      }

      if (currentTarget) {
        activePointers.set(e.pointerId, currentTarget);
        if (currentTarget.classList.contains('key')) {
          triggerKey(currentTarget, e.clientX, e.clientY);
        } else if (currentTarget.classList.contains('minor-chord-card')) {
          triggerMinorChordCard(currentTarget, e.clientX, e.clientY);
        }
      } else {
        activePointers.delete(e.pointerId);
      }
    }
  }

  function handlePointerEnd(e) {
    const prevTarget = activePointers.get(e.pointerId);
    if (prevTarget) {
      setTimeout(() => {
        prevTarget.classList.remove('active');
      }, 90);
      activePointers.delete(e.pointerId);
    }
  }

  function releaseAllActiveKeys() {
    activePointers.clear();
    allKeys.forEach(k => k.classList.remove('active'));
    minorCards.forEach(c => c.classList.remove('active'));
  }

  // Configura a cor individual de cada tecla
  allKeys.forEach(key => {
    const color = key.dataset.color;
    if (color) {
      key.style.setProperty('--key-color', color);
    }
  });

  // Eventos de Toque e Deslizamento contínuo (Glissando no Teclado e nas Notas Menores)
  if (pianoKeyboard) {
    pianoKeyboard.addEventListener('pointerdown', handlePointerStart, { passive: false });
  }
  if (minorCardsGrid) {
    minorCardsGrid.addEventListener('pointerdown', handlePointerStart, { passive: false });
  }
  window.addEventListener('pointermove', handlePointerMove, { passive: false });
  window.addEventListener('pointerup', handlePointerEnd, { passive: true });
  window.addEventListener('pointercancel', handlePointerEnd, { passive: true });
  window.addEventListener('blur', releaseAllActiveKeys);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAllActiveKeys();
  });

  /* ==========================================================================
     2. TECLADO DO COMPUTADOR (ACESSIBILIDADE / PC)
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
        triggerMinorChordCard(card);
      }
    } else {
      const keyEl = keyElementMap[action];
      if (keyEl && !activeKeysPressed.has(e.key.toLowerCase())) {
        activeKeysPressed.add(e.key.toLowerCase());
        triggerKey(keyEl);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const lowerKey = e.key.toLowerCase();
    activeKeysPressed.delete(lowerKey);
    const action = keyboardMapping[e.key];
    if (action && !action.startsWith('chord:')) {
      const keyEl = keyElementMap[action];
      if (keyEl) keyEl.classList.remove('active');
    }
  });

  /* ==========================================================================
     3. MODO CANÇÕES INFANTIS E GUIA INTERATIVO
     ========================================================================== */

  const songGuide = new SongGuide(
    // Callback de iluminação da tecla guia
    (noteName, label, index, total) => {
      allKeys.forEach(k => k.classList.remove('guide-highlight'));

      if (!noteName) return;

      const targetKey = keyElementMap[noteName];
      if (targetKey) {
        targetKey.classList.add('guide-highlight');
      }

      if (songProgressText) {
        songProgressText.textContent = `${index + 1} / ${total} (Toque: ${label})`;
      }
      updateBanner('🌟', `Siga a tecla iluminada: toque em ${label}! (${index + 1}/${total})`);
    },
    // Callback quando a canção é concluída pela criança
    (completedSong) => {
      if (congratsModal) {
        congratsModal.classList.remove('hidden');
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
    if (!songCardsContainer) return;
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

  function updateDemoButtonState(isPlaying) {
    if (!playSongDemoBtn) return;
    if (isPlaying) {
      playSongDemoBtn.textContent = '⏹ Parar Demo';
    } else {
      playSongDemoBtn.textContent = '▶ Ouvir Sozinho';
    }
  }

  function startSongPractice(songId) {
    const song = KIDS_SONGS.find(s => s.id === songId);
    if (!song) return;

    songGuideBar.classList.remove('hidden');
    currentSongName.textContent = `${song.icon} ${song.name}`;
    updateDemoButtonState(false);
    songGuide.startSong(songId);
  }

  if (playSongDemoBtn) {
    playSongDemoBtn.addEventListener('click', () => {
      if (!songGuide.currentSong) return;
      songGuide.playDemo(
        songGuide.currentSong.id,
        (note) => {
          const keyEl = keyElementMap[note];
          if (keyEl) triggerKey(keyEl, null, null, 220);
        },
        (isPlaying) => {
          updateDemoButtonState(isPlaying);
        }
      );
    });
  }

  if (stopSongBtn) {
    stopSongBtn.addEventListener('click', () => {
      songGuide.stopSong();
      updateDemoButtonState(false);
      songGuideBar.classList.add('hidden');
      document.querySelectorAll('.song-card').forEach(c => c.classList.remove('selected'));
      updateBanner('👆', 'Escolha uma música acima ou toque livremente nas teclas!');
    });
  }

  if (congratsCloseBtn) {
    congratsCloseBtn.addEventListener('click', () => {
      congratsModal.classList.add('hidden');
    });
  }

  renderSongCards();

  /* ==========================================================================
     4. ABAS DE NAVEGAÇÃO E VISUALIZAÇÃO
     ========================================================================== */

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;

      if (target === 'piano-view') {
        songsSection.classList.add('hidden');
        minorChordsSection.classList.remove('hidden');
        if (pianoKeyboard) pianoKeyboard.classList.remove('giant-mode');
        songGuide.stopSong();
        songGuideBar.classList.add('hidden');
        updateBanner('👆', 'Toque ou deslize o dedo pelas teclas e notas menores!');
      } else if (target === 'big-keys-view') {
        songsSection.classList.add('hidden');
        minorChordsSection.classList.add('hidden');
        if (pianoKeyboard) pianoKeyboard.classList.add('giant-mode');
        songGuide.stopSong();
        songGuideBar.classList.add('hidden');
        updateBanner('🎹', 'Modo Teclado Gigante: deslize os dedos pelas teclas!');
      } else if (target === 'songs-view') {
        minorChordsSection.classList.add('hidden');
        songsSection.classList.remove('hidden');
        if (pianoKeyboard) pianoKeyboard.classList.remove('giant-mode');
        updateBanner('🎵', 'Toque em uma música abaixo para aprender passo a passo!');
      }
    });
  });

  /* ==========================================================================
     5. INSTRUMENTOS E VOLUME
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
     6. EFEITOS VISUAIS E TELA CHEIA
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
     7. PWA: INSTALAÇÃO E ATALHO NO CELULAR (IPHONE & ANDROID)
     ========================================================================== */

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone && installAppBtn) {
    installAppBtn.style.display = 'none';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installAppBtn) installAppBtn.style.display = 'flex';
  });

  if (installAppBtn) {
    installAppBtn.addEventListener('click', () => {
      if (isIOS) {
        iosInstallGuide.classList.remove('hidden');
        androidInstallGuide.classList.add('hidden');
        installModal.classList.remove('hidden');
      } else if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            installAppBtn.style.display = 'none';
          }
          deferredInstallPrompt = null;
        });
      } else {
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

  // Registra o Service Worker para cache e atualização inteligente
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          reg.update();
        })
        .catch(err => {
          console.warn('Registro de Service Worker falhou:', err);
        });
    });
  }
});
