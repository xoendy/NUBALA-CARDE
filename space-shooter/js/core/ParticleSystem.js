/* ============================================
   ParticleSystem - Visual Effects Engine
   ============================================ */

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color, speed, life, size = 3) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
            const velocity = speed * (0.4 + Math.random() * 0.6);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: life * (0.5 + Math.random() * 0.5),
                maxLife: life,
                color,
                size: size * (0.5 + Math.random() * 0.5)
            });
        }
    }

    emitExplosion(x, y, color = '#ff3366', count = 20) {
        this.emit(x, y, count, color, 5, 45);
        this.emit(x, y, 8, '#ffffff', 2, 30, 2);
        this.emit(x, y, 6, '#ffcc00', 3, 25, 2);
    }

    emitThruster(x, y, color1 = '#00d4ff', color2 = '#b026ff') {
        this.emit(x, y + 12, 2, color1, 2, 12, 2);
        this.emit(x, y + 12, 1, color2, 1.5, 10, 2);
    }

    emitSparkle(x, y, color = '#ffcc00') {
        this.emit(x, y, 5, color, 1.5, 20, 2);
    }

    emitTrail(x, y, color = '#00d4ff') {
        if (Math.random() < 0.4) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 15 + Math.random() * 10,
                maxLife: 25,
                color,
                size: 1.5 + Math.random()
            });
        }
    }

    emitStarfield(width, height, density = 0.25) {
        if (Math.random() < density) {
            this.particles.push({
                x: Math.random() * width,
                y: -3,
                vx: 0,
                vy: 0.3 + Math.random() * 1.5,
                life: 300,
                maxLife: 300,
                color: Math.random() > 0.85 ? '#b026ff' : (Math.random() > 0.7 ? '#00d4ff' : '#ffffff'),
                size: 0.5 + Math.random() * 1.2
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life / Math.min(p.maxLife, 30));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles = [];
    }

    count() {
        return this.particles.length;
    }
}
