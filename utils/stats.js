
const fs = require('fs');
const path = require('path');

class Stats {
    constructor() {
        this.statsFile = path.join(__dirname, '..', 'stats.json');
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            }
        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        }
        
        return {
            commandsUsed: {},
            serversCount: 0,
            totalCommands: 0,
            uptime: Date.now()
        };
    }

    saveStats() {
        try {
            fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('خطأ في حفظ الإحصائيات:', error);
        }
    }

    recordCommand(commandName) {
        this.stats.commandsUsed[commandName] = (this.stats.commandsUsed[commandName] || 0) + 1;
        this.stats.totalCommands++;
        this.saveStats();
    }

    updateServerCount(count) {
        this.stats.serversCount = count;
        this.saveStats();
    }

    getStats() {
        return {
            ...this.stats,
            uptimeHours: Math.floor((Date.now() - this.stats.uptime) / (1000 * 60 * 60))
        };
    }
}

module.exports = new Stats();
