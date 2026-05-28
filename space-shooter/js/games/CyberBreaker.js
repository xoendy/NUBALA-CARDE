/* ============================================
   Cyber Breaker - Brick Breaker Neon Style
   ============================================ */

import { AudioSystem } from '../core/AudioSystem.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import { Storage } from '../core/Storage.js';
import { formatTime, clamp } from '../core/Utils.js';

export class CyberBreakerGame {
    constructor(canvas, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.onStateChange = onStateChange;

        this.state = 'start';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.startTime = 0;
        this.gameTime = 0;

        this.paddle = { x: 0, y: 0, width: 100, height: 14, speed: 7 };
        this.ball = { x: 0, y: 0, dx: 4, dy: -4, radius: 7, speed: 5 };
        this.bricks = [];
        this.powerups = [];

        this.keys = { left: false, right: false };
        this.animationId = null;
        this.lastTime = 0;
        this.touchX = null;

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if ((e.key === ' ' || e.key === 'Spacebar') && this.state === 'playing') {
                e.preventDefault();
            }
            if ((e.key === 'p' || e.key === 'P') && this.state === 'playing') {
                this.onStateChange('pause');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            this.updateTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.updateTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchX = null;
        }, { passive: false });
    }

    updateTouch(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
    }

    generateBricks() {
        this.bricks = [];
        const rows = 4 + this.level;
        const cols = 10;
        const brickWidth = 68;
        const brickHeight = 22;
        const padding = 6;
        const offsetX = (this.canvas.width - (cols * (brickWidth + padding) - padding)) / 2;
        const offsetY = 50;

        const colors = ['#ff3366', '#ff00aa', '#b026ff', '#00d4ff', '#00ff88', '#ffcc00'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const hp = Math.min(3, Math.floor(r / 2) + 1);
                this.bricks.push({
                    x: offsetX + c * (brickWidth + padding),
                    y: offsetY + r * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    hp: hp,
                    maxHp: hp,
                    color: colors[r % colors.length],
                    score: hp * 50 * this.level
                });
            }
        }
    }

    start() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.startTime = Date.now();
        this.gameTime = 0;

        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.paddle.y = this.canvas.height - 30;
        this.resetBall();
        this.generateBricks();
        this.powerups = [];
        this.particles.clear();

        this.lastTime = performance.now();
        this.gameLoop();
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
        this.ball.dx = Math.sin(angle) * this.ball.speed;
        this.ball.dy = -Math.cos(angle) * this.ball.speed;
    }

    gameLoop(currentTime = 0) {
        if (this.state !== 'playing') return;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(t => this.gameLoop(t));
    }

    update() {
        this.gameTime = Date.now() - this.startTime;

        // Paddle
        if (this.keys.left) this.paddle.x -= this.paddle.speed;
        if (this.keys.right) this.paddle.x += this.paddle.speed;
        if (this.touchX !== null) {
            this.paddle.x = this.touchX - this.paddle.width / 2;
        }
        this.paddle.x = clamp(this.paddle.x, 0, this.canvas.width - this.paddle.width);

        // Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collisions
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.dx *= -1;
            this.audio.playBounce();
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
            this.audio.playBounce();
        }

        // Paddle collision
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {

            const hitPoint = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            const angle = hitPoint * Math.PI / 3;
            const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.02;
            this.ball.dx = Math.sin(angle) * speed;
            this.ball.dy = -Math.cos(angle) * speed;
            this.ball.y = this.paddle.y - this.ball.radius - 1;
            this.audio.playBounce();
            this.particles.emitSparkle(this.ball.x, this.ball.y, '#00d4ff');
        }

        // Brick collisions
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const b = this.bricks[i];
            if (this.ball.x + this.ball.radius > b.x &&
                this.ball.x - this.ball.radius < b.x + b.width &&
                this.ball.y + this.ball.radius > b.y &&
                this.ball.y - this.ball.radius < b.y + b.height) {

                b.hp--;
                this.ball.dy *= -1;
                this.audio.playBounce();

                if (b.hp <= 0) {
                    this.score += b.score;
                    this.audio.playExplosion();
                    this.particles.emitExplosion(b.x + b.width / 2, b.y + b.height / 2, b.color);
                    this.bricks.splice(i, 1);

                    // Power-up chance
                    if (Math.random() < 0.08) {
                        const types = ['wide', 'multiball', 'slow'];
                        this.powerups.push({
                            x: b.x + b.width / 2,
                            y: b.y,
                            type: types[Math.floor(Math.random() * types.length)],
                            vy: 2.5,
                            radius: 12
                        });
                    }
                } else {
                    this.particles.emit(b.x + b.width / 2, b.y + b.height / 2, 4, b.color, 2, 10, 2);
                }
                break;
            }
        }

        // Power-ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.y += pu.vy;

            if (pu.y > this.paddle.y &&
                pu.x > this.paddle.x &&
                pu.x < this.paddle.x + this.paddle.width) {
                this.audio.playPowerUp();
                this.applyPowerUp(pu.type);
                this.powerups.splice(i, 1);
            } else if (pu.y > this.canvas.height + 20) {
                this.powerups.splice(i, 1);
            }
        }

        // Lose life
        if (this.ball.y > this.canvas.height + 20) {
            this.lives--;
            this.audio.playHit();
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }
            this.resetBall();
        }

        // Level complete
        if (this.bricks.length === 0) {
            this.level++;
            this.ball.speed += 0.3;
            this.resetBall();
            this.generateBricks();
            this.audio.playPowerUp();
        }

        this.particles.update();

        this.onStateChange('update', {
            score: this.score,
            level: this.level,
            lives: this.lives,
            time: formatTime(this.gameTime)
        });
    }

    applyPowerUp(type) {
        switch (type) {
            case 'wide':
                this.paddle.width = Math.min(180, this.paddle.width + 40);
                setTimeout(() => { this.paddle.width = 100; }, 8000);
                break;
            case 'slow':
                const oldSpeed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
                const factor = 0.6;
                this.ball.dx *= factor;
                this.ball.dy *= factor;
                setTimeout(() => {
                    const currentSpeed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
                    const restore = oldSpeed / currentSpeed;
                    this.ball.dx *= restore;
                    this.ball.dy *= restore;
                }, 6000);
                break;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(0, 0, w, h);

        // Bricks
        for (const b of this.bricks) {
            const alpha = b.hp / b.maxHp;
            ctx.fillStyle = b.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(b.x, b.y, b.width, b.height);

            // HP indicator
            if (b.hp > 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = 'bold 10px Orbitron';
                ctx.textAlign = 'center';
                ctx.fillText(b.hp, b.x + b.width / 2, b.y + b.height / 2 + 4);
            }
        }
        ctx.shadowBlur = 0;

        // Power-ups
        for (const pu of this.powerups) {
            const colors = { wide: '#00ff88', multiball: '#ff00aa', slow: '#00d4ff' };
            const icons = { wide: '↔', multiball: '●', slow: '⏱' };
            ctx.fillStyle = colors[pu.type] + '40';
            ctx.strokeStyle = colors[pu.type];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = colors[pu.type];
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[pu.type], pu.x, pu.y);
        }

        // Paddle
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball trail
        this.particles.emitTrail(this.ball.x, this.ball.y, '#ffcc00');
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
            kills: 0,
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
            this.lastTime = performance.now();
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
        Storage.addScore(playerName, 'cyber-breaker', this.score, this.level, 0, formatTime(this.gameTime));
    }

    destroy() {
        this.quit();
        this.particles.clear();
    }
}
