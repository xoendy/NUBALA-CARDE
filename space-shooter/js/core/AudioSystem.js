/* ============================================
   AudioSystem - Web Audio API Engine
   ============================================ */

export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
        this.masterGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.15;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    }

    _makeOsc(freq, type, duration, fadeOut = true) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (fadeOut) {
            gain.gain.setValueAtTime(1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        }
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() {
        this._makeOsc(880, 'square', 0.08);
        this._makeOsc(440, 'square', 0.08, false);
    }

    playExplosion() {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start(this.ctx.currentTime);
    }

    playPowerUp() {
        if (!this.enabled || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.07);
            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.07);
            gain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + i * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.07 + 0.15);
            osc.start(this.ctx.currentTime + i * 0.07);
            osc.stop(this.ctx.currentTime + i * 0.07 + 0.15);
        });
    }

    playHit() {
        this._makeOsc(200, 'sawtooth', 0.15);
        this._makeOsc(100, 'square', 0.15);
    }

    playGameOver() {
        if (!this.enabled || !this.ctx) return;
        const notes = [392, 349, 311, 277, 233];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.18);
            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.18);
            gain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + i * 0.18 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.18 + 0.35);
            osc.start(this.ctx.currentTime + i * 0.18);
            osc.stop(this.ctx.currentTime + i * 0.18 + 0.35);
        });
    }

    playBounce() {
        this._makeOsc(300, 'sine', 0.1);
    }

    playEat() {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playClick() {
        this._makeOsc(1200, 'sine', 0.05);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
