
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(level, message, guildId = null, metadata = {}) {
        const timestamp = new Date().toISOString();
        
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            guildId,
            message,
            ...metadata
        };
        
        try {
            const logFile = path.join(this.logDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
        } catch (error) {
        }
    }

    info(message, guildId = null, metadata = {}) {
        this.log('info', message, guildId, metadata);
    }

    error(message, guildId = null, metadata = {}) {
        this.log('error', message, guildId, metadata);
    }

    warn(message, guildId = null, metadata = {}) {
        this.log('warn', message, guildId, metadata);
    }

    debug(message, guildId = null, metadata = {}) {
        this.log('debug', message, guildId, metadata);
    }

    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            let cleanedCount = 0;
            files.forEach(file => {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < sevenDaysAgo) {
                        fs.unlinkSync(filePath);
                        cleanedCount++;
                    }
                }
            });
            
            if (cleanedCount > 0) {
                this.info('Cleaned old log files', null, { count: cleanedCount });
            }
        } catch (error) {
        }
    }
}

module.exports = new Logger();
