/* ============================================
   Void Runner - Endless Runner Espacial
   ============================================ */

import { AudioSystem } from '../core/AudioSystem.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import { Storage } from '../core/Storage.js';
import { formatTime, randomInt, clamp } from '../core/Utils.js';

export class VoidRunnerGame {
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

        this.player = { x: 100, y: 0, width: 40, height: 50, vy: 0, jumping: false, ducking: false, onGround: false };
        this.groundY = 0;
        this.obstacles = [];
        this.crystals = [];
        this.speed = 5;
        this.spawnTimer = 0;
        this.crystalTimer = 0;
        this.backgroundOffset = 0;
        this.stars = [];

        this.keys = { up: false, down: false };
        this.touchY = null;
        this.isTouching = false;
        this.animationId = null;
        this.lastTime = 0;

        this.bindEvents();
        this.initStars();
    }

    bindEvents() {
        const keyHandler = (e, pressed) => {
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = pressed;
                if (pressed && this.state === 'playing') this.jump();
                e.preventDefault();
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = pressed;
                if (pressed && this.state === 'playing') this.duck();
            }
            if ((e.key === 'p' || e.key === 'P') && pressed && this.state === 'playing') {
                this.onStateChange('pause');
            }
        };

        document.addEventListener('keydown', e => keyHandler(e, true));
        document.addEventListener('keyup', e => keyHandler(e, false));

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            this.isTouching = true;
            this.touchY = e.touches[0].clientY;
            const rect = this.canvas.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.touches[0].clientY < midY) this.jump();
            else this.duck();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.player.ducking = false;
        }, { passive: false });
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.7,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
    }

    jump() {
        if (this.player.onGround) {
            this.player.vy = -14;
            this.player.jumping = true;
            this.player.onGround = false;
            this.audio.playBounce();
            this.particles.emit(this.player.x + 20, this.player.y + this.player.height, 5, '#00d4ff', 2, 15, 2);
        }
    }

    duck() {
        if (this.player.onGround) {
            this.player.ducking = true;
            this.player.height = 30;
            setTimeout(() => {
                this.player.ducking = false;
                this.player.height = 50;
            }, 800);
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

        this.groundY = this.canvas.height - 80;
        this.player.x = 100;
        this.player.y = this.groundY - this.player.height;
        this.player.vy = 0;
        this.player.jumping = false;
        this.player.ducking = false;
        this.player.onGround = true;

        this.obstacles = [];
        this.crystals = [];
        this.speed = 5.5;
        this.spawnTimer = 0;
        this.crystalTimer = 0;
        this.backgroundOffset = 0;
        this.particles.clear();

        this.lastTime = performance.now();
        this.gameLoop();
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
        this.score += Math.floor(this.speed);

        // Level progression
        const newLevel = Math.floor(this.score / 3000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.speed += 0.8;
        }

        // Background
        this.backgroundOffset -= this.speed * 0.3;
        if (this.backgroundOffset < -100) this.backgroundOffset += 100;

        // Stars
        for (const star of this.stars) {
            star.x -= star.speed * (this.speed / 5);
            if (star.x < -10) {
                star.x = this.canvas.width + 10;
                star.y = Math.random() * this.canvas.height * 0.7;
            }
        }

        // Player physics
        this.player.vy += 0.6; // gravity
        this.player.y += this.player.vy;

        if (this.player.y + this.player.height >= this.groundY) {
            this.player.y = this.groundY - this.player.height;
            this.player.vy = 0;
            this.player.jumping = false;
            this.player.onGround = true;
        }

        // Spawn obstacles
        this.spawnTimer++;
        const spawnInterval = Math.max(40, 90 - this.level * 5);
        if (this.spawnTimer >= spawnInterval + randomInt(-15, 15)) {
            this.spawnTimer = 0;
            const type = randomInt(0, 2); // 0=laser, 1=hole, 2=drone
            const obs = {
                x: this.canvas.width + 50,
                y: type === 1 ? this.groundY - 40 : this.groundY - (type === 0 ? 60 : 50),
                width: type === 0 ? 20 : (type === 1 ? 50 : 40),
                height: type === 0 ? 60 : (type === 1 ? 40 : 50),
                type: type,
                passed: false
            };
            this.obstacles.push(obs);
        }

        // Spawn crystals
        this.crystalTimer++;
        if (this.crystalTimer >= 70) {
            this.crystalTimer = 0;
            this.crystals.push({
                x: this.canvas.width + 30,
                y: randomInt(this.groundY - 150, this.groundY - 40),
                radius: 10,
                collected: false
            });
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            // Collision
            const px = this.player.x + this.player.width / 2;
            const py = this.player.y + this.player.height / 2;
            const ox = obs.x + obs.width / 2;
            const oy = obs.y + obs.height / 2;
            const dist = Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);

            if (dist < 35 && !obs.passed) {
                obs.passed = true;
                this.lives--;
                this.audio.playHit();
                this.particles.emitExplosion(px, py, '#ff3366');
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }

            if (obs.x < -100) this.obstacles.splice(i, 1);
        }

        // Update crystals
        for (let i = this.crystals.length - 1; i >= 0; i--) {
            const c = this.crystals[i];
            c.x -= this.speed;

            const dist = Math.sqrt((this.player.x + 20 - c.x) ** 2 + (this.player.y + 25 - c.y) ** 2);
            if (dist < 30 && !c.collected) {
                c.collected = true;
                this.score += 200 * this.level;
                this.audio.playEat();
                this.particles.emitSparkle(c.x, c.y, '#ffcc00');
                this.crystals.splice(i, 1);
            } else if (c.x < -50) {
                this.crystals.splice(i, 1);
            }
        }

        this.particles.emitStarfield(this.canvas.width, this.canvas.height, 0.1);
        this.particles.update();

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

        // Background
        ctx.fillStyle = '#080818';
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (const star of this.stars) {
            const alpha = 0.3 + star.brightness * 0.7;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = star.brightness > 0.7 ? '#b026ff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ground
        ctx.fillStyle = '#151530';
        ctx.fillRect(0, this.groundY, w, h - this.groundY);
        ctx.strokeStyle = '#b026ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#b026ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(w, this.groundY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Grid on ground
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridOffset = this.backgroundOffset % 50;
        for (let x = gridOffset; x < w; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, this.groundY);
            ctx.lineTo(x - 30, h);
            ctx.stroke();
        }

        // Crystals
        for (const c of this.crystals) {
            const pulse = Math.sin(Date.now() / 150) * 2;
            ctx.fillStyle = '#ffcc00';
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - c.radius - pulse);
            ctx.lineTo(c.x + c.radius + pulse, c.y);
            ctx.lineTo(c.x, c.y + c.radius + pulse);
            ctx.lineTo(c.x - c.radius - pulse, c.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Obstacles
        for (const obs of this.obstacles) {
            if (obs.type === 0) {
                // Laser pillar
                ctx.fillStyle = '#ff3366';
                ctx.shadowColor = '#ff3366';
                ctx.shadowBlur = 12;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Laser beam
                ctx.fillStyle = 'rgba(255, 51, 102, 0.3)';
                ctx.fillRect(obs.x - 5, obs.y + 10, obs.width + 10, 5);
            } else if (obs.type === 1) {
                // Hole/spike
                ctx.fillStyle = '#ff6600';
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + obs.height);
                ctx.lineTo(obs.x + obs.width / 2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.closePath();
                ctx.fill();
            } else {
                // Drone
                ctx.fillStyle = '#00d4ff';
                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff3366';
                ctx.beginPath();
                ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;

        // Player
        ctx.save();
        const px = this.player.x;
        const py = this.player.y;

        // Trail
        this.particles.emitTrail(px + 20, py + 25, '#00d4ff');

        // Body
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 18;

        if (this.player.ducking) {
            ctx.fillRect(px, py + 20, this.player.width, 30);
        } else {
            // Head
            ctx.beginPath();
            ctx.arc(px + 20, py + 12, 12, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillRect(px + 10, py + 20, 20, 20);
            // Legs
            ctx.fillRect(px + 8, py + 35, 10, 15);
            ctx.fillRect(px + 22, py + 35, 10, 15);
        }

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(px + 24, py + 10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Particles
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
        Storage.addScore(playerName, 'void-runner', this.score, this.level, 0, formatTime(this.gameTime));
    }

    destroy() {
        this.quit();
        this.particles.clear();
    }
}
