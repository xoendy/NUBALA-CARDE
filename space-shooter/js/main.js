/* ============================================
   NEBULA ARCADE - Main Entry Point
   Game Router & UI Controller
   ============================================ */

import { SpaceShooterGame } from './games/SpaceShooter.js';
import { NeonSnakeGame } from './games/NeonSnake.js';
import { CyberBreakerGame } from './games/CyberBreaker.js';
import { VoidRunnerGame } from './games/VoidRunner.js';
import { NeonPongGame } from './games/NeonPong.js';
import { Storage } from './core/Storage.js';
import { showToast, createStars, escapeHtml, timeAgo } from './core/Utils.js';

// ============================================
// APP STATE
// ============================================
const AppState = {
    currentUser: null,
    isAdmin: false,
    currentGame: null,
    currentGameInstance: null,
    rankingFilter: 'all',
    rankingGameFilter: 'all',
    rankingPage: 1,
    rankingPerPage: 10
};

const GAMES = {
    'space-shooter': { title: 'Space Shooter', class: SpaceShooterGame, controls: [
        { keys: '← → / A D', action: 'Mover nave' },
        { keys: 'ESPAÇO', action: 'Atirar (auto)' },
        { keys: 'P', action: 'Pausar' }
    ]},
    'neon-snake': { title: 'Neon Snake', class: NeonSnakeGame, controls: [
        { keys: '↑ ↓ ← →', action: 'Direção' },
        { keys: 'W A S D', action: 'Direção' },
        { keys: 'P', action: 'Pausar' }
    ]},
    'cyber-breaker': { title: 'Cyber Breaker', class: CyberBreakerGame, controls: [
        { keys: '← → / A D', action: 'Mover paddle' },
        { keys: 'TOQUE', action: 'Posição X' },
        { keys: 'P', action: 'Pausar' }
    ]},
    'void-runner': { title: 'Void Runner', class: VoidRunnerGame, controls: [
        { keys: 'ESPAÇO / ↑', action: 'Pular' },
        { keys: '↓ / S', action: 'Abaixar' },
        { keys: 'P', action: 'Pausar' }
    ]},
    'neon-pong': { title: 'Neon Pong', class: NeonPongGame, controls: [
        { keys: '↑ ↓ / W S', action: 'Mover paddle' },
        { keys: 'TOQUE', action: 'Posição Y' },
        { keys: 'P', action: 'Pausar' }
    ]}
};

// ============================================
// NAVIGATION
// ============================================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (navLink) navLink.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sectionId === 'ranking') renderRanking();
}

// ============================================
// GAME MANAGER
// ============================================
function loadGame(gameId) {
    const gameConfig = GAMES[gameId];
    if (!gameConfig) return;

    // Destroy previous game
    if (AppState.currentGameInstance) {
        AppState.currentGameInstance.destroy();
        AppState.currentGameInstance = null;
    }

    AppState.currentGame = gameId;

    // Update UI
    document.getElementById('currentGameTitle').textContent = gameConfig.title;
    document.getElementById('startTitle').textContent = gameConfig.title;
    document.getElementById('startDesc').textContent = 'Clique para iniciar';

    // Controls
    const controlsList = document.getElementById('controlsList');
    controlsList.innerHTML = gameConfig.controls.map(c => `
        <div class="control-item">
            <kbd class="key">${c.keys}</kbd>
            <span>${c.action}</span>
        </div>
    `).join('');

    // Mini leaderboard
    renderMiniLeaderboard(gameId);

    // Show game player
    showSection('game-player');

    // Reset overlays
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');

    // Create game instance
    const canvas = document.getElementById('mainGameCanvas');
    AppState.currentGameInstance = new gameConfig.class(canvas, handleGameStateChange);

    // Draw preview
    AppState.currentGameInstance.draw();
}

function handleGameStateChange(type, data) {
    switch (type) {
        case 'update':
            document.getElementById('scoreValue').textContent = data.score.toLocaleString();
            document.getElementById('levelValue').textContent = data.level;
            document.getElementById('livesValue').textContent = '❤'.repeat(Math.max(0, data.lives));
            document.getElementById('timeValue').textContent = data.time;
            break;

        case 'gameover':
            document.getElementById('finalScore').textContent = data.score.toLocaleString();
            document.getElementById('finalStats').innerHTML = `
                <div class="fstat"><span class="fstat-label">Nível</span><span class="fstat-value">${data.level}</span></div>
                <div class="fstat"><span class="fstat-label">Tempo</span><span class="fstat-value">${data.time}</span></div>
                <div class="fstat"><span class="fstat-label">Pontos</span><span class="fstat-value">${data.score.toLocaleString()}</span></div>
            `;
            document.getElementById('gameOverScreen').classList.remove('hidden');

            // Auto-save if logged in
            if (AppState.currentUser) {
                AppState.currentGameInstance.saveScore(AppState.currentUser.username);
                showToast('Pontuação salva automaticamente!', 'success');
            }
            break;

        case 'pause':
            document.getElementById('pauseScreen').classList.remove('hidden');
            break;
    }
}

function renderMiniLeaderboard(gameId) {
    const scores = Storage.getScores().filter(s => s.game === gameId).sort((a, b) => b.score - a.score).slice(0, 3);
    const container = document.getElementById('miniLeaderboard');

    const ranks = ['gold', 'silver', 'bronze'];
    const emojis = ['🥇', '🥈', '🥉'];

    container.innerHTML = scores.map((s, i) => `
        <div class="mini-player">
            <span class="mini-rank ${ranks[i]}">${emojis[i]}</span>
            <span class="mini-name">${escapeHtml(s.name)}</span>
            <span class="mini-score">${s.score.toLocaleString()}</span>
        </div>
    `).join('') || '<div style="text-align:center;color:var(--text-muted);padding:0.5rem;">Sem pontuações</div>';
}

// ============================================
// RANKING
// ============================================
function renderRanking() {
    const tbody = document.getElementById('rankingBody');
    let scores = Storage.getScores();

    // Time filter
    const now = new Date();
    if (AppState.rankingFilter === 'week') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        scores = scores.filter(s => new Date(s.date) >= weekAgo);
    } else if (AppState.rankingFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scores = scores.filter(s => new Date(s.date) >= today);
    }

    // Game filter
    if (AppState.rankingGameFilter !== 'all') {
        scores = scores.filter(s => s.game === AppState.rankingGameFilter);
    }

    scores.sort((a, b) => b.score - a.score);

    const totalPages = Math.ceil(scores.length / AppState.rankingPerPage) || 1;
    AppState.rankingPage = Math.min(AppState.rankingPage, totalPages);
    const start = (AppState.rankingPage - 1) * AppState.rankingPerPage;
    const pageScores = scores.slice(start, start + AppState.rankingPerPage);

    const gameNames = {
        'space-shooter': 'Space Shooter',
        'neon-snake': 'Neon Snake',
        'cyber-breaker': 'Cyber Breaker',
        'void-runner': 'Void Runner',
        'neon-pong': 'Neon Pong'
    };

    tbody.innerHTML = pageScores.map((s, i) => {
        const rank = start + i + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        return `
            <tr>
                <td class="col-rank"><span class="rank-number ${rankClass}">${rank}</span></td>
                <td class="col-player">${escapeHtml(s.name)}</td>
                <td class="col-game">${gameNames[s.game] || s.game}</td>
                <td class="col-score">${s.score.toLocaleString()}</td>
                <td class="col-level">${s.level}</td>
                <td class="col-date">${timeAgo(s.date)}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhuma pontuação</td></tr>';

    document.getElementById('pageInfo').textContent = `Página ${AppState.rankingPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = AppState.rankingPage <= 1;
    document.getElementById('nextPage').disabled = AppState.rankingPage >= totalPages;
}

// ============================================
// AUTH
// ============================================
function login(username, password) {
    const users = Storage.getUsers();
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

    if (!user) {
        showToast('Usuário ou senha incorretos!', 'error');
        return false;
    }

    AppState.currentUser = user;
    AppState.isAdmin = user.isAdmin || false;
    Storage.saveSession(user);
    updateUserUI();
    showToast(`Bem-vindo, ${user.username}!`, 'success');
    showSection('home');
    return true;
}

function register(username, email, password) {
    const users = Storage.getUsers();
    if (users.some(u => u.username === username)) {
        showToast('Nome de usuário já existe!', 'error');
        return false;
    }
    if (users.some(u => u.email === email)) {
        showToast('Email já cadastrado!', 'error');
        return false;
    }

    const user = {
        id: Date.now(),
        username,
        email,
        password,
        isAdmin: false,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    Storage.saveUsers(users);

    AppState.currentUser = user;
    Storage.saveSession(user);
    updateUserUI();
    showToast('Conta criada com sucesso!', 'success');
    showSection('home');
    return true;
}

function logout() {
    AppState.currentUser = null;
    AppState.isAdmin = false;
    Storage.clearSession();
    updateUserUI();
    showToast('Você saiu.', 'info');
    showSection('home');
}

function updateUserUI() {
    const user = AppState.currentUser;
    const loginLink = document.getElementById('loginNavLink');
    const userBadge = document.getElementById('userBadge');
    const userNameDisplay = document.getElementById('userNameDisplay');

    if (user) {
        loginLink.classList.add('hidden');
        userBadge.classList.remove('hidden');
        userNameDisplay.textContent = user.username;
    } else {
        loginLink.classList.remove('hidden');
        userBadge.classList.add('hidden');
        userNameDisplay.textContent = '';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Storage.seedDemoData();
    createStars('particles-bg', 50);

    // Navigation
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
            document.getElementById('navLinks').classList.remove('active');
        });
    });

    // Game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.dataset.game;
            loadGame(gameId);
        });
    });

    // Game controls
    document.getElementById('btnBackToGames').addEventListener('click', () => {
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.quit();
            AppState.currentGameInstance = null;
        }
        showSection('home');
    });

    document.getElementById('btnStartGame').addEventListener('click', () => {
        document.getElementById('startScreen').classList.add('hidden');
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.start();
        }
    });

    document.getElementById('btnRestart').addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('hidden');
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.restart();
        }
    });

    document.getElementById('btnSaveScore').addEventListener('click', () => {
        const name = AppState.currentUser ? AppState.currentUser.username : prompt('Seu nome:') || 'Anônimo';
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.saveScore(name);
            showToast('Pontuação salva!', 'success');
            renderMiniLeaderboard(AppState.currentGame);
        }
    });

    document.getElementById('btnResume').addEventListener('click', () => {
        document.getElementById('pauseScreen').classList.add('hidden');
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.resume();
        }
    });

    document.getElementById('btnQuit').addEventListener('click', () => {
        document.getElementById('pauseScreen').classList.add('hidden');
        if (AppState.currentGameInstance) {
            AppState.currentGameInstance.quit();
            AppState.currentGameInstance = null;
        }
        showSection('home');
    });

    // Fullscreen
    document.getElementById('btnFullscreen').addEventListener('click', () => {
        const canvas = document.getElementById('mainGameCanvas');
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    });

    // Sound toggle
    let soundEnabled = true;
    document.getElementById('btnSound').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('btnSound').textContent = soundEnabled ? '🔊' : '🔇';
        if (AppState.currentGameInstance && AppState.currentGameInstance.audio) {
            AppState.currentGameInstance.audio.enabled = soundEnabled;
        }
    });

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const formId = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
            document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
            document.getElementById(formId).classList.remove('hidden');
        });
    });

    // Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        login(user, pass);
    });

    // Register
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPass').value;
        const confirm = document.getElementById('regPassConfirm').value;

        if (pass !== confirm) {
            showToast('Senhas não coincidem!', 'error');
            return;
        }
        register(name, email, pass);
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', logout);

    // Ranking filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.rankingFilter = btn.dataset.filter;
            AppState.rankingPage = 1;
            renderRanking();
        });
    });

    document.querySelectorAll('.rank-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            AppState.rankingGameFilter = tab.dataset.game;
            AppState.rankingPage = 1;
            renderRanking();
        });
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (AppState.rankingPage > 1) {
            AppState.rankingPage--;
            renderRanking();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const scores = Storage.getScores();
        const totalPages = Math.ceil(scores.length / AppState.rankingPerPage) || 1;
        if (AppState.rankingPage < totalPages) {
            AppState.rankingPage++;
            renderRanking();
        }
    });

    // Footer game links
    document.querySelectorAll('.footer-col a[data-game]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const gameId = link.dataset.game;
            loadGame(gameId);
        });
    });

    // Check saved session
    const savedUser = Storage.getSession();
    if (savedUser) {
        AppState.currentUser = savedUser;
        AppState.isAdmin = savedUser.isAdmin || false;
        updateUserUI();
    }

    // Resize canvas
    function resizeCanvas() {
        const canvas = document.getElementById('mainGameCanvas');
        const container = canvas.parentElement;
        const maxWidth = Math.min(800, container.clientWidth - 20);
        const aspectRatio = 800 / 600;
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (maxWidth / aspectRatio) + 'px';
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Draw game previews on home
    drawGamePreviews();
});

// ============================================
// GAME PREVIEWS (mini canvas animations)
// ============================================
function drawGamePreviews() {
    const previews = {
        'space-shooter': drawSpacePreview,
        'neon-snake': drawSnakePreview,
        'cyber-breaker': drawBreakerPreview,
        'void-runner': drawRunnerPreview,
        'neon-pong': drawPongPreview
    };

    Object.entries(previews).forEach(([id, drawFn]) => {
        const container = document.getElementById(`preview-${id}`);
        if (!container) return;
        const canvas = container.querySelector('canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        drawFn(ctx, canvas.width, canvas.height);
    });
}

function drawSpacePreview(ctx, w, h) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = Math.random() > 0.7 ? '#b026ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ship
    const sx = w / 2, sy = h / 2 + 20;
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#b026ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#b026ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 20);
    ctx.lineTo(sx - 15, sy + 10);
    ctx.lineTo(sx + 15, sy + 10);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Enemies
    ctx.strokeStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(w/2 - 40, sy - 40);
    ctx.lineTo(w/2 - 30, sy - 30);
    ctx.lineTo(w/2 - 40, sy - 20);
    ctx.lineTo(w/2 - 50, sy - 30);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w/2 + 40, sy - 50);
    ctx.lineTo(w/2 + 50, sy - 40);
    ctx.lineTo(w/2 + 40, sy - 30);
    ctx.lineTo(w/2 + 30, sy - 40);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawSnakePreview(ctx, w, h) {
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, w, h);

    const gs = 20;
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.1)';
    for (let x = 0; x < w; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Snake body
    const segments = [
        { x: 8, y: 5 }, { x: 7, y: 5 }, { x: 6, y: 5 },
        { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }
    ];

    segments.forEach((seg, i) => {
        const alpha = 1 - (i / segments.length) * 0.5;
        ctx.fillStyle = i === 0 ? '#00ff88' : '#00d4ff';
        ctx.globalAlpha = alpha;
        ctx.shadowColor = i === 0 ? '#00ff88' : '#00d4ff';
        ctx.shadowBlur = i === 0 ? 12 : 6;
        ctx.fillRect(seg.x * gs + 2, seg.y * gs + 2, gs - 4, gs - 4);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Food
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(10 * gs + gs/2, 5 * gs + gs/2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawBreakerPreview(ctx, w, h) {
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, w, h);

    // Bricks
    const colors = ['#ff3366', '#ff00aa', '#b026ff', '#00d4ff'];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
            ctx.fillStyle = colors[r % colors.length];
            ctx.shadowColor = colors[r % colors.length];
            ctx.shadowBlur = 5;
            ctx.fillRect(20 + c * 32, 30 + r * 24, 28, 20);
        }
    }
    ctx.shadowBlur = 0;

    // Paddle
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(w/2 - 35, h - 30, 70, 10);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(w/2, h/2 + 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawRunnerPreview(ctx, w, h) {
    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h * 0.6, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = '#151530';
    ctx.fillRect(0, h - 50, w, 50);
    ctx.strokeStyle = '#b026ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - 50);
    ctx.lineTo(w, h - 50);
    ctx.stroke();

    // Player
    const px = w / 2 - 15, py = h - 75;
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(px + 15, py + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 5, py + 18, 20, 15);
    ctx.fillRect(px + 3, py + 30, 10, 12);
    ctx.fillRect(px + 17, py + 30, 10, 12);
    ctx.shadowBlur = 0;

    // Obstacle
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 10;
    ctx.fillRect(w/2 + 50, h - 65, 12, 35);
    ctx.shadowBlur = 0;
}

function drawPongPreview(ctx, w, h) {
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, w, h);

    // Center line
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.2)';
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(w/2, 0);
    ctx.lineTo(w/2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(20, h/2 - 30, 10, 60, 5);
    ctx.fill();

    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.beginPath();
    ctx.roundRect(w - 30, h/2 - 30, 10, 60, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}
