

const logger = require('./logger');


class SmartCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 10000;
        this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000; 
        this.cleanupInterval = options.cleanupInterval || 15 * 60 * 1000; 
        
        this._startCleanup();
    }


    set(key, value, ttl = this.defaultTTL) {
        if (this.cache.size >= this.maxSize) {
            this._evictOldest();
        }

        this.cache.set(key, {
            value,
            createdAt: Date.now(),
            lastAccess: Date.now(),
            ttl,
            accessCount: 0
        });
    }


    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) return null;

        if (Date.now() - entry.createdAt > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        entry.lastAccess = Date.now();
        entry.accessCount++;

        return entry.value;
    }


    has(key) {
        return this.get(key) !== null;
    }


    delete(key) {
        return this.cache.delete(key);
    }


    _evictOldest() {
        let oldestKey = null;
        let oldestAccess = Infinity;

        for (const [key, entry] of this.cache) {
            if (entry.lastAccess < oldestAccess) {
                oldestAccess = entry.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }


    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache) {
            if (now - entry.createdAt > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Cache cleanup completed', null, { 
                cleaned, 
                remaining: this.cache.size 
            });
        }

        return cleaned;
    }


    _startCleanup() {
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }


    clear() {
        this.cache.clear();
    }


    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
}


class ResourceManager {
    constructor(client) {
        this.client = client;
        this.cache = new SmartCache({
            maxSize: 10000,
            ttl: client.config?.CACHE_TTL_MS || 24 * 60 * 60 * 1000
        });
        
        this.stats = {
            commandsExecuted: 0,
            cacheHits: 0,
            cacheMisses: 0,
            startTime: Date.now()
        };
    }


    cleanupGuild(guildId) {
        for (const [key] of this.cache.cache) {
            if (key.startsWith(guildId)) {
                this.cache.delete(key);
            }
        }

        this.client.voiceConnections.delete(guildId);
        this.client.activeAzkar.delete(guildId);
        this.client.activeDuas.delete(guildId);
        this.client.recentAzkar.delete(guildId);
        this.client.recentDuas.delete(guildId);

        logger.debug('Guild resources cleaned', guildId);
    }


    fullCleanup() {
        const before = {
            cache: this.cache.cache.size,
            cooldowns: this.client.commandCooldowns?.size || 0
        };

        this.cache.cleanup();

        if (this.client.commandCooldowns) {
            const cutoff = Date.now() - (this.client.config?.COMMAND_COOLDOWN_MS || 3000);
            this.client.commandCooldowns.forEach((timestamp, key) => {
                if (timestamp < cutoff) {
                    this.client.commandCooldowns.delete(key);
                }
            });
        }

        const validGuilds = new Set(this.client.guilds.cache.keys());
        
        for (const [guildId] of this.client.voiceConnections) {
            if (!validGuilds.has(guildId)) {
                this.cleanupGuild(guildId);
            }
        }

        if (global.gc) {
            global.gc();
        }

        const after = {
            cache: this.cache.cache.size,
            cooldowns: this.client.commandCooldowns?.size || 0
        };

        logger.debug('Full cleanup completed', null, { before, after });
    }


    getResourceStats() {
        const memoryUsage = process.memoryUsage();
        
        return {
            memory: {
                heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
            },
            cache: this.cache.getStats(),
            guilds: this.client.guilds.cache.size,
            voiceConnections: this.client.voiceConnections.size,
            activeAzkar: this.client.activeAzkar.size,
            activeDuas: this.client.activeDuas.size,
            uptime: Date.now() - this.stats.startTime,
            stats: this.stats
        };
    }


    healthCheck() {
        const stats = this.getResourceStats();
        const maxMemory = this.client.config?.MAX_MEMORY_MB || 512;
        const memoryPercent = (stats.memory.heapUsedMB / maxMemory) * 100;

        const health = {
            status: 'healthy',
            memory: memoryPercent < 70 ? 'good' : memoryPercent < 90 ? 'warning' : 'critical',
            details: stats
        };

        if (memoryPercent >= 90) {
            health.status = 'critical';
            this.fullCleanup();
        } else if (memoryPercent >= 70) {
            health.status = 'warning';
        }

        return health;
    }
}

module.exports = {
    SmartCache,
    ResourceManager
};
