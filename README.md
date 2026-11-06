# 🎹 Piano Mágico Kids

Um jogo de piano educativo, lúdico e intuitivo desenvolvido para crianças, pronto para rodar direto no navegador em celulares **Android**, **iPhone**, tablets e computadores, com suporte a **instalação de atalho (PWA)** na tela inicial.

---

## ✨ Recursos Principais

### 1. 🎵 Teclas e Notas Fiéis (Afinação Acústica Real)
- **Todas as Teclas Naturais:**
  - **DÓ** (C4 - 261.63 Hz)
  - **RÉ** (D4 - 293.66 Hz)
  - **MI** (E4 - 329.63 Hz)
  - **FÁ** (F4 - 349.23 Hz)
  - **SOL** (G4 - 392.00 Hz)
  - **LÁ** (A4 - 440.00 Hz)
  - **SI** (B4 - 493.88 Hz)
  - **DÓ Agudo** (C5 - 523.25 Hz)
- **Teclas Sustenidas/Pretas:**
  - **DÓ# / RÉb**, **RÉ# / MIb**, **FÁ# / SOLb**, **SOL# / LÁb**, **LÁ# / SIb**
- **Sessão Especial de Notas Menores (Acordes Menores):**
  - **DÓ MENOR (Cm)**: Dó • Ré# • Sol
  - **RÉ MENOR (Dm)**: Ré • Fá • Lá
  - **MI MENOR (Em)**: Mi • Sol • Si
  - **FÁ MENOR (Fm)**: Fá • Sol# • Dó
  - **SOL MENOR (Gm)**: Sol • Lá# • Ré
  - **LÁ MENOR (Am)**: Lá • Dó • Mi
  - **SI MENOR (Bm)**: Si • Ré • Fá#
  > Ao tocar em um acorde menor, o jogo emite o som harmônico com leve dedilhado humano e ilumina no teclado do piano as 3 teclas que formam o acorde, ensinando a criança de forma visual!

### 2. 👶 Interface Intuitiva para Crianças
- Cores vibrantes do arco-íris para cada nota.
- Ícones de frutas e animais simpáticos (🦁 Leão, 🐼 Panda, 🐸 Sapo, 🐬 Golfinho, 🦊 Raposa, 🐰 Coelho, 🦄 Unicórnio).
- Partículas dinâmicas e mágicas: estrelas, bolhas, notas musicais e corações flutuam ao tocar.
- Músicas infantis com luz guia para aprender tocando (*Brilha Brilha Estrelinha*, *Parabéns Pra Você*, *Dó-Ré-Mi-Fá*, *Ciranda Cirandinha*).
- 4 Instrumentos infantis:
  - 🎹 **Piano de Cauda** (síntese acústica com harmônicos e martelo de cordas)
  - 🔔 **Xilofone Colorido** (brilhante e alegre)
  - ✨ **Caixinha Mágica** (glockenspiel brilhante)
  - 🐱 **Gatinho / Bichinho** (som fofo de miau com notas afinadas)

### 3. 📲 Suporte PWA (Instalar Atalho no Celular)
- **No Android:** Toque no botão *"Instalar no Celular"* para adicionar o ícone diretamente à tela inicial com tela cheia nativa.
- **No iPhone (iOS Safari):** O aplicativo abre um guia com 3 passos simples ilustrados:
  1. Toque no botão de Compartilhar `⎋` do Safari.
  2. Toque em `"Adicionar à Tela de Início"` `➕`.
  3. Toque em `"Adicionar"`.
- **100% Offline:** Funciona sem gastar internet depois de aberto a primeira vez graças ao Service Worker integrado.

### 4. 📱 Otimizações Móveis
- Sem atraso no toque (`touch-action: none` e `manipulation`).
- Multitouch: a criança pode usar as duas mãos e tocar várias teclas e acordes ao mesmo tempo.
- Vibração tátil no celular ao apertar as teclas.
- Funciona tanto na horizontal (paisagem) quanto na vertical (retrato).

---

## 🚀 Como Executar

### Opção 1: Abrir Diretamente no Navegador
Você pode simplesmente dar um duplo clique no arquivo [`index.html`](file:///c:/Users/Marcos/Desktop/Jogo%20de%20Piano/index.html) para abrir no Chrome, Edge, Safari ou Firefox.

### Opção 2: Testar no Celular via Rede Local (Wi-Fi)
Para testar a experiência completa de PWA e instalação no seu celular Android ou iPhone:
1. Suba um servidor web local ou publique os arquivos gratuitamente no **GitHub Pages**, **Vercel** ou **Netlify**.
2. Abra o link no celular e toque em **"Instalar no Celular"**!

---

## 🎹 Teclas de Atalho no Computador (Opcional)
Se for jogado no teclado do computador:
- Teclas Brancas: `A` (Dó), `S` (Ré), `D` (Mi), `F` (Fá), `G` (Sol), `H` (Lá), `J` (Si), `K` (Dó5)
- Teclas Pretas: `W` (Dó#), `E` (Ré#), `T` (Fá#), `Y` (Sol#), `U` (Lá#)
- Notas Menores: teclas numéricas de `1` a `7` (`1` = Dó Menor, `2` = Ré Menor, etc.)
