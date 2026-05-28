/* ============================================
   Space Shooter - Complete Game
   ============================================ */

import { AudioSystem } from '../core/AudioSystem.js';
import { ParticleSystem } from '../core/ParticleSystem.js';
import { Storage } from '../core/Storage.js';
import { formatTime, randomInt, clamp } from '../core/Utils.js';

// Entities
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = 40; this.height = 50;
        this.speed = 5.5;
        this.shootTimer = 0;
        this.shootInterval = 10;
        this.lives = 3;
        this.shield = false;
        this.doubleShot = false;
        this.speedBoost = false;
        this.invincible = 0;
        this.shieldTimer = 0;
        this.doubleTimer = 0;
        this.speedTimer = 0;
    }

    update(keys, canvasWidth, touchX) {
        const currentSpeed = this.speedBoost ? this.speed * 1.6 : this.speed;

        if (keys.left && this.x > 22) this.x -= currentSpeed;
        if (keys.right && this.x < canvasWidth - 22) this.x += currentSpeed;
        if (touchX !== null) {
            this.x += (touchX - this.x) * 0.15;
            this.x = clamp(this.x, 22, canvasWidth - 22);
        }

        this.shootTimer++;
        const bullets = [];
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            bullets.push({ x: this.x, y: this.y - 20, vy: -11, damage: 1 });
            if (this.doubleShot) {
                bullets.push({ x: this.x - 16, y: this.y - 12, vy: -11, damage: 1 });
                bullets.push({ x: this.x + 16, y: this.y - 12, vy: -11, damage: 1 });
            }
        }

        if (this.invincible > 0) this.invincible--;
        if (this.shieldTimer > 0) { this.shieldTimer--; if (this.shieldTimer <= 0) this.shield = false; }
        if (this.doubleTimer > 0) { this.doubleTimer--; if (this.doubleTimer <= 0) this.doubleShot = false; }
        if (this.speedTimer > 0) { this.speedTimer--; if (this.speedTimer <= 0) this.speedBoost = false; }

        return bullets;
    }

    draw(ctx) {
        ctx.save();

        if (this.shield) {
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 36, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        const mainColor = this.speedBoost ? '#00ff88' : '#b026ff';
        ctx.fillStyle = '#151528';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 18;

        // Ship hull
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 26);
        ctx.lineTo(this.x - 20, this.y + 14);
        ctx.lineTo(this.x - 9, this.y + 20);
        ctx.lineTo(this.x, this.y + 10);
        ctx.lineTo(this.x + 9, this.y + 20);
        ctx.lineTo(this.x + 20, this.y + 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 10);
        ctx.lineTo(this.x - 7, this.y + 6);
        ctx.lineTo(this.x + 7, this.y + 6);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + 14);
        ctx.lineTo(this.x - 28, this.y + 22);
        ctx.moveTo(this.x + 20, this.y + 14);
        ctx.lineTo(this.x + 28, this.y + 22);
        ctx.stroke();

        // Engines
        ctx.fillStyle = this.doubleShot ? '#ff00aa' : '#00d4ff';
        ctx.shadowColor = this.doubleShot ? '#ff00aa' : '#00d4ff';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(this.x - 11, this.y + 22, 3.5, 0, Math.PI * 2);
        ctx.arc(this.x + 11, this.y + 22, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    hit() {
        if (this.shield) { this.shield = false; this.shieldTimer = 0; return false; }
        if (this.invincible > 0) return false;
        this.lives--;
        this.invincible = 100;
        return true;
    }

    addLife() { if (this.lives < 5) this.lives++; }
    activateShield() { this.shield = true; this.shieldTimer = 500; }
    activateDoubleShot() { this.doubleShot = true; this.doubleTimer = 400; }
    activateSpeed() { this.speedBoost = true; this.speedTimer = 300; }
}

class Enemy {
    constructor(x, y, type = 1) {
        this.x = x; this.y = y;
        this.type = type;
        this.radius = 16 + type * 2;
        this.vx = (Math.random() - 0.5) * (1 + type * 0.6);
        this.vy = 0.8 + type * 0.7;
        this.hp = type;
        this.score = type * 100;
        this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.08;
        this.shootCooldown = 0;
    }

    update(canvasWidth) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        if (this.shootCooldown > 0) this.shootCooldown--;

        if (this.x < this.radius || this.x > canvasWidth - this.radius) {
            this.vx *= -1;
            this.x = clamp(this.x, this.radius, canvasWidth - this.radius);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const colors = ['#ff3366', '#ff00aa', '#ff6600', '#ffcc00'];
        const color = colors[this.type - 1] || colors[0];

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';

        if (this.type === 1) {
            ctx.beginPath();
            ctx.moveTo(0, -16);
            ctx.lineTo(14, 0);
            ctx.lineTo(0, 16);
            ctx.lineTo(-14, 0);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        } else if (this.type === 2) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const px = Math.cos(angle) * 16;
                const py = Math.sin(angle) * 16;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 3) {
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i - Math.PI / 4;
                const r = i % 2 === 0 ? 18 : 8;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        } else {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI / 5) * i - Math.PI / 2;
                const r = i % 2 === 0 ? 18 : 7;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        }

        if (this.hp > 1) {
            ctx.fillStyle = color;
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(this.hp, 0, 4);
        }

        ctx.restore();
    }

    canShoot() {
        return this.type >= 2 && this.shootCooldown <= 0 && Math.random() < 0.008 * this.type;
    }

    resetShoot() { this.shootCooldown = 80; }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.type = type;
        this.vy = 2.2;
        this.life = 450;
        this.pulse = 0;
        this.radius = 14;
    }

    update() {
        this.y += this.vy;
        this.pulse += 0.12;
        this.life--;
    }

    draw(ctx) {
        const scale = 1 + Math.sin(this.pulse) * 0.12;
        const alpha = this.life < 120 ? this.life / 120 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        const colors = { shield: '#00d4ff', double: '#ff00aa', speed: '#00ff88', life: '#ff3366' };
        const icons = { shield: '🛡️', double: '🔫', speed: '⚡', life: '❤️' };
        const color = colors[this.type];

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = color + '22';

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(icons[this.type], 0, 1);

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vy, isEnemy = false) {
        this.x = x; this.y = y;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.width = isEnemy ? 4 : 4;
        this.height = isEnemy ? 10 : 14;
        this.radius = 3;
    }

    update() { this.y += this.vy; }

    draw(ctx) {
        ctx.save();
        const color = this.isEnemy ? '#ff3366' : '#00d4ff';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 2);
        ctx.fill();
        ctx.restore();
    }
}

// Main Game Class
export class SpaceShooterGame {
    constructor(canvas, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();
        this.particles = new ParticleSystem();
        this.onStateChange = onStateChange;

        this.state = 'start';
        this.score = 0;
        this.level = 1;
        this.kills = 0;
        this.startTime = 0;
        this.gameTime = 0;

        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.ebullets = [];
        this.powerups = [];

        this.keys = { left: false, right: false };
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 80;
        this.powerupSpawnTimer = 0;
        this.powerupSpawnInterval = 550;

        this.animationId = null;
        this.lastTime = 0;

        this.touchX = null;
        this.isTouching = false;

        this.bindEvents();
    }

    bindEvents() {
        const keyHandler = (e, pressed) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = pressed;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = pressed;
            if ((e.key === ' ' || e.key === 'Spacebar') && pressed) e.preventDefault();
            if ((e.key === 'p' || e.key === 'P') && pressed && this.state === 'playing') {
                this.onStateChange('pause');
            }
        };

        document.addEventListener('keydown', e => keyHandler(e, true));
        document.addEventListener('keyup', e => keyHandler(e, false));

        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            this.isTouching = true;
            this.audio.init();
            this.updateTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (this.isTouching) this.updateTouch(e);
        }, { passive: false });

        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.isTouching = false;
            this.touchX = null;
        }, { passive: false });
    }

    updateTouch(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.touchX = (e.touches[0].clientX - rect.left) * scaleX;
    }

    start() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0; this.level = 1; this.kills = 0;
        this.startTime = Date.now(); this.gameTime = 0;

        this.player = new Player(this.canvas.width / 2, this.canvas.height - 80);
        this.enemies = []; this.bullets = []; this.ebullets = []; this.powerups = [];
        this.particles.clear();

        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 80;
        this.powerupSpawnTimer = 0;

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

        const newLevel = Math.floor(this.score / 2000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.enemySpawnInterval = Math.max(25, 80 - this.level * 4);
        }

        // Player
        const newBullets = this.player.update(this.keys, this.canvas.width, this.touchX);
        if (newBullets.length > 0) {
            this.audio.playShoot();
            newBullets.forEach(b => this.bullets.push(new Bullet(b.x, b.y, b.vy)));
        }
        this.particles.emitThruster(this.player.x, this.player.y);

        // Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].y < -20) this.bullets.splice(i, 1);
        }

        for (let i = this.ebullets.length - 1; i >= 0; i--) {
            this.ebullets[i].update();
            if (this.ebullets[i].y > this.canvas.height + 20) this.ebullets.splice(i, 1);
        }

        // Enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            const type = Math.random() < 0.12 + this.level * 0.04 
                ? Math.min(4, Math.floor(Math.random() * this.level) + 1) 
                : 1;
            const x = randomInt(40, this.canvas.width - 40);
            this.enemies.push(new Enemy(x, -35, type));
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.canvas.width);
            if (e.canShoot()) {
                e.resetShoot();
                this.ebullets.push(new Bullet(e.x, e.y + 18, 4.5, true));
            }
            if (e.y > this.canvas.height + 60) this.enemies.splice(i, 1);
        }

        // Power-ups
        this.powerupSpawnTimer++;
        if (this.powerupSpawnTimer >= this.powerupSpawnInterval) {
            this.powerupSpawnTimer = 0;
            const types = ['shield', 'double', 'speed', 'life'];
            const type = types[randomInt(0, types.length - 1)];
            this.powerups.push(new PowerUp(randomInt(30, this.canvas.width - 30), -30, type));
        }

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (this.powerups[i].y > this.canvas.height + 50 || this.powerups[i].life <= 0) {
                this.powerups.splice(i, 1);
            }
        }

        this.checkCollisions();
        this.particles.emitStarfield(this.canvas.width, this.canvas.height, 0.2);
        this.particles.update();

        if (this.player.lives <= 0) {
            this.gameOver();
        }

        this.onStateChange('update', {
            score: this.score,
            level: this.level,
            lives: this.player.lives,
            time: formatTime(this.gameTime)
        });
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const e = this.enemies[ei];
                const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
                if (dist < e.radius + 5) {
                    e.hp -= 1;
                    this.bullets.splice(bi, 1);
                    this.particles.emit(b.x, b.y, 4, '#00d4ff', 2, 12, 2);
                    if (e.hp <= 0) {
                        this.score += e.score;
                        this.kills++;
                        this.audio.playExplosion();
                        this.particles.emitExplosion(e.x, e.y);
                        this.enemies.splice(ei, 1);
                    }
                    break;
                }
            }
        }

        // Enemy bullets vs player
        for (let i = this.ebullets.length - 1; i >= 0; i--) {
            const b = this.ebullets[i];
            const dist = Math.sqrt((b.x - this.player.x) ** 2 + (b.y - this.player.y) ** 2);
            if (dist < 24) {
                this.ebullets.splice(i, 1);
                if (this.player.hit()) {
                    this.audio.playHit();
                    this.particles.emitExplosion(this.player.x, this.player.y, '#ff3366');
                } else {
                    this.audio.playExplosion();
                    this.particles.emit(this.player.x, this.player.y, 6, '#00d4ff', 3, 18, 2);
                }
            }
        }

        // Enemies vs player
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dist = Math.sqrt((e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2);
            if (dist < 32) {
                this.enemies.splice(i, 1);
                this.audio.playExplosion();
                this.particles.emitExplosion(e.x, e.y);
                if (this.player.hit()) {
                    this.audio.playHit();
                    this.particles.emitExplosion(this.player.x, this.player.y, '#ff3366');
                }
            }
        }

        // Power-ups vs player
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            const dist = Math.sqrt((pu.x - this.player.x) ** 2 + (pu.y - this.player.y) ** 2);
            if (dist < 32) {
                this.audio.playPowerUp();
                this.particles.emit(pu.x, pu.y, 12, '#00ff88', 3, 22, 2);
                switch (pu.type) {
                    case 'shield': this.player.activateShield(); break;
                    case 'double': this.player.activateDoubleShot(); break;
                    case 'speed': this.player.activateSpeed(); break;
                    case 'life': this.player.addLife(); break;
                }
                this.powerups.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(8, 8, 20, 0.25)';
        ctx.fillRect(0, 0, w, h);

        this.particles.draw(ctx);
        for (const pu of this.powerups) pu.draw(ctx);
        for (const e of this.enemies) e.draw(ctx);
        for (const b of this.bullets) b.draw(ctx);
        for (const b of this.ebullets) b.draw(ctx);
        if (this.player) this.player.draw(ctx);

        // HUD
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
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
        ctx.fillText('❤'.repeat(Math.max(0, this.player.lives)), w - 12, 23);
    }

    gameOver() {
        this.state = 'gameover';
        cancelAnimationFrame(this.animationId);
        this.audio.playGameOver();

        this.onStateChange('gameover', {
            score: this.score,
            level: this.level,
            kills: this.kills,
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
        Storage.addScore(playerName, 'space-shooter', this.score, this.level, this.kills, formatTime(this.gameTime));
    }

    destroy() {
        this.quit();
        this.particles.clear();
    }
}
