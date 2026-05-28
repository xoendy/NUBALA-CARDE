/* ============================================
   Neon Snake - Classic with Cyberpunk Style
   ============================================ */

import { AudioSystem } from '../core/AudioSystem.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import { Storage } from '../core/Storage.js';
import { formatTime, randomInt } from '../core/Utils.js';

export class NeonSnakeGame {
    constructor(canvas, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.onStateChange = onStateChange;

        this.gridSize = 20;
        this.tileCount = { x: 40, y: 30 };
        this.state = 'start';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.startTime = 0;
        this.gameTime = 0;

        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.specialFood = null;
        this.specialTimer = 0;
        this.speed = 120;
        this.lastMove = 0;
        this.animationId = null;

        this.keys = {};
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            if (['ArrowUp', 'w', 'W'].includes(key) && this.direction.y === 0) {
                this.nextDirection = { x: 0, y: -1 };
                e.preventDefault();
            }
            if (['ArrowDown', 's', 'S'].includes(key) && this.direction.y === 0) {
                this.nextDirection = { x: 0, y: 1 };
                e.preventDefault();
            }
            if (['ArrowLeft', 'a', 'A'].includes(key) && this.direction.x === 0) {
                this.nextDirection = { x: -1, y: 0 };
                e.preventDefault();
            }
            if (['ArrowRight', 'd', 'D'].includes(key) && this.direction.x === 0) {
                this.nextDirection = { x: 1, y: 0 };
                e.preventDefault();
            }
            if ((key === 'p' || key === 'P') && this.state === 'playing') {
                this.onStateChange('pause');
            }
        });

        // Touch controls - swipe
        let touchStartX = 0, touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 20 && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
                if (dx < -20 && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
            } else {
                if (dy > 20 && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
                if (dy < -20 && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
            }
        }, { passive: false });
    }

    start() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.startTime = Date.now();
        this.gameTime = 0;

        const cx = Math.floor(this.tileCount.x / 2);
        const cy = Math.floor(this.tileCount.y / 2);
        this.snake = [
            { x: cx, y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.speed = 130;
        this.spawnFood();
        this.specialFood = null;
        this.specialTimer = 0;
        this.particles.clear();

        this.gameLoop();
    }

    spawnFood() {
        do {
            this.food = {
                x: randomInt(0, this.tileCount.x - 1),
                y: randomInt(0, this.tileCount.y - 1)
            };
        } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y));
    }

    spawnSpecialFood() {
        if (this.specialFood) return;
        do {
            this.specialFood = {
                x: randomInt(0, this.tileCount.x - 1),
                y: randomInt(0, this.tileCount.y - 1),
                type: Math.random() < 0.5 ? 'bonus' : 'speed',
                life: 200
            };
        } while (this.snake.some(s => s.x === this.specialFood.x && s.y === this.specialFood.y) ||
                 (this.food.x === this.specialFood.x && this.food.y === this.specialFood.y));
    }

    gameLoop() {
        if (this.state !== 'playing') return;

        const now = Date.now();
        this.gameTime = now - this.startTime;

        if (now - this.lastMove > this.speed) {
            this.lastMove = now;
            this.update();
        }

        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.direction = { ...this.nextDirection };

        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Wall wrap
        if (head.x < 0) head.x = this.tileCount.x - 1;
        if (head.x >= this.tileCount.x) head.x = 0;
        if (head.y < 0) head.y = this.tileCount.y - 1;
        if (head.y >= this.tileCount.y) head.y = 0;

        // Self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.lives--;
            this.audio.playHit();
            this.particles.emitExplosion(head.x * this.gridSize + 10, head.y * this.gridSize + 10, '#ff3366');
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }
            // Reset snake
            const cx = Math.floor(this.tileCount.x / 2);
            const cy = Math.floor(this.tileCount.y / 2);
            this.snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
            return;
        }

        this.snake.unshift(head);

        // Eat food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 100 * this.level;
            this.audio.playEat();
            this.particles.emitSparkle(head.x * this.gridSize + 10, head.y * this.gridSize + 10, '#00ff88');
            this.spawnFood();

            // Level up every 5 foods
            if (this.score > 0 && this.score % 500 === 0) {
                this.level++;
                this.speed = Math.max(60, this.speed - 8);
            }

            // Chance for special food
            if (Math.random() < 0.15 && !this.specialFood) {
                this.spawnSpecialFood();
            }
        } else {
            this.snake.pop();
        }

        // Special food
        if (this.specialFood) {
            this.specialFood.life--;
            if (this.specialFood.life <= 0) {
                this.specialFood = null;
            } else if (head.x === this.specialFood.x && head.y === this.specialFood.y) {
                if (this.specialFood.type === 'bonus') {
                    this.score += 500 * this.level;
                    this.audio.playPowerUp();
                    this.particles.emitSparkle(head.x * this.gridSize + 10, head.y * this.gridSize + 10, '#ffcc00');
                } else {
                    this.speed = Math.max(50, this.speed - 15);
                    this.audio.playPowerUp();
                }
                this.specialFood = null;
            }
        }

        this.onStateChange('update', {
            score: this.score,
            level: this.level,
            lives: this.lives,
            time: formatTime(this.gameTime)
        });
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const gs = this.gridSize;

        // Background
        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += gs) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y <= h; y += gs) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, i) => {
            const isHead = i === 0;
            const alpha = 1 - (i / this.snake.length) * 0.4;
            const color = isHead ? '#00ff88' : '#00d4ff';

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = color;
            ctx.shadowBlur = isHead ? 15 : 8;

            const padding = isHead ? 1 : 2;
            ctx.fillRect(
                segment.x * gs + padding,
                segment.y * gs + padding,
                gs - padding * 2,
                gs - padding * 2
            );

            if (isHead) {
                // Eyes
                ctx.fillStyle = '#0a0a18';
                ctx.shadowBlur = 0;
                const ex = segment.x * gs + gs / 2;
                const ey = segment.y * gs + gs / 2;
                const eyeOffset = 4;
                ctx.beginPath();
                ctx.arc(ex - eyeOffset + this.direction.x * 2, ey - eyeOffset + this.direction.y * 2, 2.5, 0, Math.PI * 2);
                ctx.arc(ex + eyeOffset + this.direction.x * 2, ey - eyeOffset + this.direction.y * 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Draw food
        if (this.food) {
            const fx = this.food.x * gs + gs / 2;
            const fy = this.food.y * gs + gs / 2;
            const pulse = Math.sin(Date.now() / 200) * 2;

            ctx.fillStyle = '#ff3366';
            ctx.shadowColor = '#ff3366';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(fx, fy, 6 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Special food
        if (this.specialFood) {
            const sx = this.specialFood.x * gs + gs / 2;
            const sy = this.specialFood.y * gs + gs / 2;
            const color = this.specialFood.type === 'bonus' ? '#ffcc00' : '#b026ff';
            const alpha = this.specialFood.life < 60 ? this.specialFood.life / 60 : 1;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        // Particles
        this.particles.update();
        this.particles.draw(ctx);

        // HUD
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, w, 36);
        ctx.font = 'bold 13px Orbitron';
        ctx.fillStyle = '#00d4ff';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 12, 23);
        ctx.fillStyle = '#b026ff';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${this.level}`, w / 2, 23);
        ctx.fillStyle = '#ff3366';
        ctx.textAlign = 'right';
        ctx.fillText('❤'.repeat(this.lives), w - 12, 23);
    }

    gameOver() {
        this.state = 'gameover';
        cancelAnimationFrame(this.animationId);
        this.audio.playGameOver();
        this.onStateChange('gameover', {
            score: this.score,
            level: this.level,
            kills: this.snake.length - 3,
            time: formatTime(this.gameTime)
        });
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            cancelAnimationFrame(this.animationId);
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.lastMove = Date.now();
            this.gameLoop();
        }
    }

    quit() {
        this.state = 'start';
        cancelAnimationFrame(this.animationId);
        this.particles.clear();
    }

    restart() {
        this.start();
    }

    saveScore(playerName) {
        Storage.addScore(playerName, 'neon-snake', this.score, this.level, this.snake.length - 3, formatTime(this.gameTime));
    }

    destroy() {
        this.quit();
        this.particles.clear();
    }
}
