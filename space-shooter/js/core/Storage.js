/* ============================================
   Storage - LocalStorage Data Manager
   ============================================ */

const KEYS = {
    USERS: 'nebula_users',
    SCORES: 'nebula_scores',
    SETTINGS: 'nebula_settings',
    SESSION: 'nebula_session'
};

export class Storage {
    static getUsers() {
        return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    }

    static saveUsers(users) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    static getScores() {
        return JSON.parse(localStorage.getItem(KEYS.SCORES) || '[]');
    }

    static saveScores(scores) {
        localStorage.setItem(KEYS.SCORES, JSON.stringify(scores.slice(0, 200)));
    }

    static addScore(name, game, score, level, kills, time) {
        const scores = this.getScores();
        scores.push({
            id: Date.now() + Math.random(),
            name: name || 'Anônimo',
            game,
            score,
            level: level || 1,
            kills: kills || 0,
            time: time || '00:00',
            date: new Date().toISOString()
        });
        scores.sort((a, b) => b.score - a.score);
        this.saveScores(scores);
        return scores;
    }

    static getSettings() {
        return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify({
            soundEnabled: true,
            difficulty: 'normal'
        }));
    }

    static saveSettings(settings) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    }

    static getSession() {
        const data = sessionStorage.getItem(KEYS.SESSION);
        return data ? JSON.parse(data) : null;
    }

    static saveSession(user) {
        sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    }

    static clearSession() {
        sessionStorage.removeItem(KEYS.SESSION);
    }

    static seedDemoData() {
        let users = this.getUsers();
        let scores = this.getScores();

        if (users.length === 0) {
            users.push({
                id: 1, username: 'admin', email: 'admin@nebula.com',
                password: 'admin123', isAdmin: true,
                createdAt: new Date().toISOString()
            });
            this.saveUsers(users);
        }

        if (scores.length === 0) {
            const demoData = [
                { name: 'StarLord', game: 'space-shooter', score: 15800, level: 9, kills: 142, time: '05:32' },
                { name: 'NebulaX', game: 'neon-snake', score: 12400, level: 15, kills: 0, time: '04:15' },
                { name: 'CyberPilot', game: 'cyber-breaker', score: 9800, level: 8, kills: 0, time: '03:48' },
                { name: 'VoidWalker', game: 'void-runner', score: 8200, level: 12, kills: 0, time: '03:12' },
                { name: 'NovaStrike', game: 'space-shooter', score: 7500, level: 6, kills: 71, time: '02:55' },
                { name: 'GalaxyAce', game: 'neon-pong', score: 6300, level: 5, kills: 0, time: '02:30' },
                { name: 'QuantumDrift', game: 'void-runner', score: 5400, level: 8, kills: 0, time: '02:10' },
                { name: 'NebulaRider', game: 'cyber-breaker', score: 4200, level: 5, kills: 0, time: '01:45' },
                { name: 'PixelHunter', game: 'space-shooter', score: 18900, level: 11, kills: 168, time: '06:12' },
                { name: 'RetroGamer', game: 'neon-snake', score: 15600, level: 19, kills: 0, time: '05:45' },
                { name: 'ArcadeKing', game: 'neon-pong', score: 11200, level: 9, kills: 0, time: '04:30' },
                { name: 'BlockMaster', game: 'cyber-breaker', score: 13500, level: 11, kills: 0, time: '05:15' },
            ];

            demoData.forEach((d, i) => {
                scores.push({
                    id: 1000 + i,
                    name: d.name,
                    game: d.game,
                    score: d.score,
                    level: d.level,
                    kills: d.kills,
                    time: d.time,
                    date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
                });
            });
            this.saveScores(scores);
        }
    }
}
