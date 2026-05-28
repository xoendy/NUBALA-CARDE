/* ============================================
   Neon Pong - Classic Pong with Cyberpunk Style
   ============================================ */

import { AudioSystem } from '../core/AudioSystem.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import { Storage } from '../core/Storage.js';
import { formatTime, clamp } from '../core/Utils.js';

export class NeonPongGame {
    constructor(canvas, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.onStateChange = onStateChange;

        this.state = 'start';
        this.score = 0;  // player score
        this.aiScore = 0;
        this.level = 1;
        this.lives = 3;  // actually "games to win"
        this.startTime = 0;
        this.gameTime = 0;

        this.paddle = { x: 30, y: 0, width: 14, height: 90, speed: 6 };
        this.aiPaddle = { x: 0, y: 0, width: 14, height: 90, speed: 4.5 };
        this.ball = { x: 0, y: 0, dx: 5, dy: 3, radius: 8, speed: 6, maxSpeed: 12 };
        this.powerups = [];

        this.keys = { up: false, down: false };
        this.touchY = null;
        this.animationId = null;
        this.lastTime = 0;

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = true;
                e.preventDefault();
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = true;
                e.preventDefault();
            }
            if ((e.key === ' ' || e.key === 'Spacebar') && this.state === 'start') {
                e.preventDefault();
                this.start();
            }
            if ((e.key === 'p' || e.key === 'P') && this.state === 'playing') {
                this.onStateChange('pause');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
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
            this.touchY = null;
        }, { passive: false });
    }

    updateTouch(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleY = this.canvas.height / rect.height;
        this.touchY = (e.touches[0].clientY - rect.top) * scaleY;
    }

    start() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0;
        this.aiScore = 0;
        this.level = 1;
        this.lives = 3;
        this.startTime = Date.now();
        this.gameTime = 0;

        this.paddle.y = this.canvas.height / 2 - this.paddle.height / 2;
        this.aiPaddle.x = this.canvas.width - 44;
        this.aiPaddle.y = this.canvas.height / 2 - this.aiPaddle.height / 2;
        this.resetBall();
        this.powerups = [];
        this.particles.clear();

        this.lastTime = performance.now();
        this.gameLoop();
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
        const dir = Math.random() > 0.5 ? 1 : -1;
        this.ball.dx = Math.cos(angle) * this.ball.speed * dir;
        this.ball.dy = Math.sin(angle) * this.ball.speed;
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

        // Player paddle
        if (this.keys.up) this.paddle.y -= this.paddle.speed;
        if (this.keys.down) this.paddle.y += this.paddle.speed;
        if (this.touchY !== null) {
            this.paddle.y = this.touchY - this.paddle.height / 2;
        }
        this.paddle.y = clamp(this.paddle.y, 10, this.canvas.height - this.paddle.height - 10);

        // AI paddle (follows ball with delay)
        const targetY = this.ball.y - this.aiPaddle.height / 2;
        const diff = targetY - this.aiPaddle.y;
        this.aiPaddle.y += diff * 0.08 * (this.level * 0.15 + 0.85);
        this.aiPaddle.y = clamp(this.aiPaddle.y, 10, this.canvas.height - this.aiPaddle.height - 10);

        // Ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collisions
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
            this.audio.playBounce();
            this.particles.emitSparkle(this.ball.x, this.ball.y, '#00d4ff');
        }

        // Paddle collisions
        // Player
        if (this.ball.dx < 0 &&
            this.ball.x - this.ball.radius < this.paddle.x + this.paddle.width &&
            this.ball.x + this.ball.radius > this.paddle.x &&
            this.ball.y > this.paddle.y &&
            this.ball.y < this.paddle.y + this.paddle.height) {

            const hitPoint = (this.ball.y - (this.paddle.y + this.paddle.height / 2)) / (this.paddle.height / 2);
            const angle = hitPoint * Math.PI / 3;
            const speed = Math.min(this.ball.maxSpeed, Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.05);
            this.ball.dx = Math.cos(angle) * speed;
            this.ball.dy = Math.sin(angle) * speed;
            this.ball.x = this.paddle.x + this.paddle.width + this.ball.radius + 1;
            this.audio.playBounce();
            this.particles.emitSparkle(this.ball.x, this.ball.y, '#00ff88');

            // Strong hit effect
            if (speed > 9) {
                this.particles.emit(this.ball.x, this.ball.y, 8, '#ffcc00', 3, 20, 2);
            }
        }

        // AI
        if (this.ball.dx > 0 &&
            this.ball.x + this.ball.radius > this.aiPaddle.x &&
            this.ball.x - this.ball.radius < this.aiPaddle.x + this.aiPaddle.width &&
            this.ball.y > this.aiPaddle.y &&
            this.ball.y < this.aiPaddle.y + this.aiPaddle.height) {

            const hitPoint = (this.ball.y - (this.aiPaddle.y + this.aiPaddle.height / 2)) / (this.aiPaddle.height / 2);
            const angle = hitPoint * Math.PI / 3;
            const speed = Math.min(this.ball.maxSpeed, Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.05);
            this.ball.dx = -Math.cos(angle) * speed;
            this.ball.dy = Math.sin(angle) * speed;
            this.ball.x = this.aiPaddle.x - this.ball.radius - 1;
            this.audio.playBounce();
        }

        // Score
        if (this.ball.x < -20) {
            this.aiScore++;
            this.audio.playHit();
            if (this.aiScore >= 5) {
                this.lives--;
                this.aiScore = 0;
                this.score = 0;
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }
            this.resetBall();
        }
        if (this.ball.x > this.canvas.width + 20) {
            this.score++;
            this.score += this.level * 100;
            this.audio.playEat();
            this.particles.emitSparkle(this.ball.x, this.ball.y, '#ffcc00');
            if (this.score > 0 && this.score % 500 === 0) {
                this.level++;
                this.aiPaddle.speed += 0.5;
            }
            this.resetBall();
        }

        // Power-ups
        if (Math.random() < 0.002) {
            const types = ['speed', 'big', 'slow'];
            this.powerups.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: Math.random() * (this.canvas.height - 40) + 20,
                type: types[Math.floor(Math.random() * types.length)],
                radius: 12,
                life: 400
            });
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.life--;
            const dist = Math.sqrt((this.ball.x - pu.x) ** 2 + (this.ball.y - pu.y) ** 2);
            if (dist < pu.radius + this.ball.radius) {
                this.applyPowerUp(pu.type);
                this.audio.playPowerUp();
                this.powerups.splice(i, 1);
            } else if (pu.life <= 0) {
                this.powerups.splice(i, 1);
            }
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
            case 'speed':
                this.ball.speed = Math.min(this.ball.maxSpeed, this.ball.speed + 1);
                break;
            case 'big':
                this.paddle.height = Math.min(140, this.paddle.height + 20);
                setTimeout(() => { this.paddle.height = 90; }, 6000);
                break;
            case 'slow':
                this.ball.speed = Math.max(4, this.ball.speed - 1);
                break;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = '#0a0a18';
        ctx.fillRect(0, 0, w, h);

        // Center line
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 15]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Power-ups
        for (const pu of this.powerups) {
            const alpha = pu.life < 100 ? pu.life / 100 : 1;
            const colors = { speed: '#ffcc00', big: '#00ff88', slow: '#00d4ff' };
            const color = colors[pu.type];
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color + '30';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Paddles
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 7);
        ctx.fill();

        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.beginPath();
        ctx.roundRect(this.aiPaddle.x, this.aiPaddle.y, this.aiPaddle.width, this.aiPaddle.height, 7);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball
        const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
        const ballColor = speed > 9 ? '#ffcc00' : '#ffffff';
        ctx.fillStyle = ballColor;
        ctx.shadowColor = ballColor;
        ctx.shadowBlur = speed > 9 ? 25 : 15;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball trail
        this.particles.emitTrail(this.ball.x, this.ball.y, ballColor);
        this.particles.draw(ctx);

        // Score
        ctx.font = 'bold 48px Orbitron';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.score}  ${this.aiScore}`, w / 2, 60);

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
        Storage.addScore(playerName, 'neon-pong', this.score, this.level, 0, formatTime(this.gameTime));
    }

    destroy() {
        this.quit();
        this.particles.clear();
    }
}
