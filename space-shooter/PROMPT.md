# NEBULA ARCADE - Portal de Jogos Online Profissional

## Visão Geral
Crie um portal de jogos online estilo Friv/Miniclip com design cyberpunk futurista, usando **HTML5, CSS3 e JavaScript ES6+ modular**. O site deve conter **5 jogos completos e jogáveis** diretamente no navegador, com sistema de ranking, autenticação de usuários e interface profissional.

---

## 🎨 Design System

### Paleta de Cores
- **Background:** `#0a0a12` (preto espacial)
- **Secundário:** `#12121f` (card background)
- **Roxo Neon:** `#b026ff` (primário, destaques)
- **Azul Neon:** `#00d4ff` (secundário, informações)
- **Rosa Neon:** `#ff00aa` (acentos)
- **Verde Neon:** `#00ff88` (sucesso)
- **Vermelho Neon:** `#ff3366` (perigo, vidas)
- **Amarelo:** `#ffcc00` (pontos, destaques)
- **Texto Principal:** `#ffffff`
- **Texto Secundário:** `#a0a0c0`
- **Texto Mudo:** `#505070`

### Tipografia
- **Títulos:** Orbitron (Google Fonts) - pesos 400, 700, 900
- **Corpo:** Rajdhani (Google Fonts) - pesos 300, 400, 600, 700
- **Tamanhos responsivos** usando clamp()

### Efeitos Visuais
- **Glassmorphism:** backdrop-filter: blur(20px) + borda semi-transparente
- **Neon Glow:** box-shadow e text-shadow com cores neon
- **Glitch Effect:** nos títulos principais com pseudo-elementos animados
- **Partículas flutuantes** no background
- **Hover transitions** suaves em todos elementos interativos
- **Grid de jogos** estilo Friv com cards e thumbnails animadas

---

## 📁 Estrutura de Arquivos

```
space-shooter/
├── index.html              # Estrutura principal
├── styles.css              # Estilos completos (~30KB)
├── js/
│   ├── main.js             # Entry point, router, UI controller
│   ├── core/
│   │   ├── AudioSystem.js  # Web Audio API engine
│   │   ├── ParticleSystem.js # Efeitos visuais
│   │   ├── Storage.js      # LocalStorage manager
│   │   └── Utils.js        # Helpers (formatTime, escapeHtml, etc)
│   ├── games/
│   │   ├── SpaceShooter.js # Jogo 1 - Nave espacial
│   │   ├── NeonSnake.js   # Jogo 2 - Cobrinha neon
│   │   ├── CyberBreaker.js # Jogo 3 - Brick Breaker
│   │   ├── VoidRunner.js  # Jogo 4 - Endless Runner
│   │   └── NeonPong.js    # Jogo 5 - Pong futurista
│   └── ui/
│       ├── Auth.js         # Login/Cadastro
│       ├── Ranking.js      # Tabelas e filtros
│       └── Navigation.js   # Menu e rotas
└── assets/
    └── sounds/             # (gerados via Web Audio API)
```

---

## 🎮 Os 5 Jogos

### 1. Space Shooter (Ação)
- Nave espacial controlada por teclado/setas ou toque
- Movimentação suave com inércia
- Tiros automáticos + power-up de tiro duplo
- 4 tipos de inimigos (drone, hexágono, cruz, estrela) com HP crescente
- Power-ups: Escudo, Tiro Duplo, Velocidade, Vida Extra
- Sistema de níveis progressivos (dificuldade aumenta)
- Partículas de explosão e thruster
- Inimigos atiram de volta (níveis avançados)
- Sons: tiro, explosão, power-up, hit, game over

### 2. Neon Snake (Arcade)
- Grid 40x20 tiles, cobrinha neon com gradiente
- Controles: setas/WASD + swipe no mobile
- Comida pulsante vermelha, comida especial amarela/roxa
- Cobra com olhos que olham na direção do movimento
- Rastro de partículas ao mover
- Power-ups: Bônus (+500pts) e Slow Motion
- Vidas: 3, perde vida ao bater em si mesma
- Level up a cada 5 comidas, velocidade aumenta

### 3. Cyber Breaker (Puzzle/Ação)
- Brick Breaker clássico com estilo cyberpunk
- Paddle neon azul, bola amarela com rastro
- Blocos coloridos com HP indicado (1-3 hits)
- Power-ups: Paddle Largo, Bola Lenta
- Níveis progressivos com mais fileiras de blocos
- Física realista de reflexão com ângulo baseado no ponto de impacto
- Sons: bounce, explosão de bloco, power-up

### 4. Void Runner (Endless Runner)
- Personagem correndo em plataforma espacial
- Desvie de obstáculos (laser, buracos, inimigos)
- Pule com espaço/toque, agachar com seta baixa
- Velocidade aumenta gradualmente
- Colete cristais de energia para pontos
- Power-ups: Escudo, Ímã (atrai cristais), Velocidade Lenta
- Background parallax com estrelas e nebulosas
- Double jump disponível

### 5. Neon Pong (Esporte)
- Pong clássico 1 jogador vs IA
- Paddle jogador (esquerda) e IA (direita)
- Bola com rastro de partículas coloridas
- Placar estilo arcade
- IA com dificuldade adaptativa
- Power-ups aleatórios no meio da tela
- Efeito de "golpe forte" quando a bola atinge velocidade máxima
- Sons: bounce, ponto marcado, game over

---

## 🏗️ Arquitetura JavaScript

### Padrão: ES6 Modules
```javascript
// main.js - Entry point
import { SpaceShooterGame } from './games/SpaceShooter.js';
import { NeonSnakeGame } from './games/NeonSnake.js';
import { CyberBreakerGame } from './games/CyberBreaker.js';
import { VoidRunnerGame } from './games/VoidRunner.js';
import { NeonPongGame } from './games/NeonPong.js';
import { AudioSystem } from './core/AudioSystem.js';
import { Storage } from './core/Storage.js';
```

### Classe Base de Jogo (interface comum)
Cada jogo deve implementar:
- `constructor(canvas, onStateChange)` - inicialização
- `start()` - inicia partida
- `pause()` / `resume()` - controle de pausa
- `restart()` - reinicia
- `quit()` - sai para menu
- `saveScore(playerName)` - salva pontuação
- `destroy()` - limpeza de recursos

### Sistema de Estados
```javascript
onStateChange(type, data) {
  // 'update' -> { score, level, lives, time }
  // 'gameover' -> { score, level, kills, time }
  // 'pause' -> sem dados
}
```

---

## 📊 Funcionalidades do Site

### Página Inicial (Grid Friv-style)
- Grid responsivo de cards de jogos (minmax 260px)
- Thumbnail com preview animado em canvas
- Badge de status (HOT, NEW, POPULAR)
- Hover revela botão "JOGAR" com gradiente neon
- Informações: título, descrição, categoria, plays

### Player de Jogo
- Canvas centralizado (800x600, responsivo)
- Sidebar com: status em tempo real, controles, mini-ranking
- Overlays: Start, Game Over, Pause
- Botões: Voltar, Fullscreen, Som
- Controles adaptativos (teclado + touch)

### Ranking Global
- Tabela com: rank, jogador, jogo, pontuação, nível, data
- Filtros: Todos, Semana, Hoje
- Tabs por jogo: Todos, Space Shooter, Neon Snake, etc.
- Paginação (10 por página)
- Destaque top 3 com cores ouro/prata/bronze

### Autenticação
- Tabs: Entrar / Cadastrar
- Formulários com validação
- Login: usuário/email + senha
- Cadastro: nick + email + senha + confirmação
- Sessão via sessionStorage
- Logout

### Sistema de Dados
- LocalStorage para persistência
- Tabelas: users, scores
- Seed de dados demo (8 jogadores, 12 scores)
- Admin user padrão: admin/admin123

---

## 🔊 Sistema de Áudio (Web Audio API)

```javascript
class AudioSystem {
  init() // cria AudioContext
  playShoot()     // oscilador square, decaimento rápido
  playExplosion() // noise buffer + lowpass filter
  playPowerUp()   // sequência de notas ascendentes
  playHit()       // sawtooth grave
  playGameOver()  // sequência descendente triste
  playBounce()    // sine curta
  playEat()       // triangle ascendente
  playClick()     // sine alta
  toggle()        // on/off
}
```

---

## 🎆 ParticleSystem

```javascript
class ParticleSystem {
  emit(x, y, count, color, speed, life, size)
  emitExplosion(x, y, color, count)   // explosão com múltiplas cores
  emitThruster(x, y, color1, color2)  // fogo de nave
  emitSparkle(x, y, color)            // brilho
  emitTrail(x, y, color)              // rastro
  emitStarfield(width, height, density) // estrelas caindo
  update()  // atualiza posições e vida
  draw(ctx) // renderiza com alpha
}
```

---

## 📱 Responsividade

### Breakpoints
- **Desktop (>1024px):** Sidebar + canvas lado a lado
- **Tablet (768-1024px):** Sidebar embaixo, horizontal
- **Mobile (<768px):** Canvas fullscreen, sidebar oculta (botão toggle)
- **Pequeno (<480px):** Canvas 100% width, controles touch otimizados

### Touch
- Space Shooter: toque e arraste para mover
- Neon Snake: swipe nas direções
- Cyber Breaker: toque na posição X do paddle
- Void Runner: toque para pular, hold para agachar
- Neon Pong: toque Y para mover paddle

---

## 🎯 Requisitos Técnicos

1. **Zero dependências externas** (exceto Google Fonts)
2. **Canvas 2D API** para todos os jogos
3. **ES6 Modules** com import/export
4. **Web Audio API** para todos os sons
5. **LocalStorage** para persistência
6. **Sem frameworks** (Vanilla JS)
7. **Sem backend necessário** - funciona 100% offline
8. **Cross-browser:** Chrome, Firefox, Safari, Edge
9. **Performance:** 60fps em jogos, <16ms frame time
10. **Acessibilidade:** ARIA labels, focus states, redução de movimento

---

## 🚀 Como Executar

1. Baixe todos os arquivos
2. Abra `index.html` em qualquer navegador moderno
3. Ou use um servidor local: `python -m http.server 8000`
4. Funciona offline após primeiro carregamento

---

## 📊 Métricas de Qualidade

- **Lighthouse Score:** >90 em Performance, Acessibilidade, Best Practices
- **Tamanho total:** <200KB (sem assets externos)
- **First Paint:** <1s
- **Time to Interactive:** <2s
- **Jogos carregam:** sob demanda (lazy loading dos módulos)

---

## ✨ Diferenciais Profissionais

1. **Preview animado** nos cards da home (mini-canvas rodando demo)
2. **Sistema de conquistas** (primeiro jogo, 1000 pts, etc)
3. **Efeito de transição** entre páginas (fade + slide)
4. **Notificações toast** em vez de alerts
5. **Modo escuro automático** (sempre escuro, tema cyberpunk)
6. **Save states** automáticos durante o jogo
7. **Tutorial interativo** no primeiro acesso
8. **Estatísticas pessoais** (melhor pontuação, tempo total, jogos favoritos)
9. **Compartilhamento** de pontuação (gera imagem/texto)
10. **Modo zen** (sem sons, sem partículas excessivas)
