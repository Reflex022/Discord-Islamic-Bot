
const logger = require('./logger');

class RateLimiter {
    /**
     * @param {number} maxRequests 
     * @param {number} windowMs 
     */
    constructor(maxRequests = 5, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map(); 
        
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    
    /**
     * @param {string} userId 
     * @returns {Object} 
     */
    check(userId) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];
        
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        if (validRequests.length >= this.maxRequests) {
            const oldestRequest = Math.min(...validRequests);
            const retryAfter = this.windowMs - (now - oldestRequest);
            
            logger.warn('Rate limit exceeded', null, {
                userId,
                requests: validRequests.length,
                maxRequests: this.maxRequests
            });
            
            return {
                limited: true,
                retryAfter: Math.ceil(retryAfter / 1000), 
                remaining: 0
            };
        }
        
        validRequests.push(now);
        this.requests.set(userId, validRequests);
        
        return {
            limited: false,
            retryAfter: 0,
            remaining: this.maxRequests - validRequests.length
        };
    }
    
    /**
     * @param {string} userId 
     */
    reset(userId) {
        this.requests.delete(userId);
        logger.debug('Rate limit reset', null, { userId });
    }
    
    /**
     * @param {string} userId 
     * @returns {Object} 
     */
    getUsage(userId) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];
        
        const validRequests = userRequests.filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        return {
            requests: validRequests.length,
            remaining: Math.max(0, this.maxRequests - validRequests.length)
        };
    }
    
    /**
     * Clean up old 
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [userId, timestamps] of this.requests.entries()) {
            const validRequests = timestamps.filter(
                timestamp => now - timestamp < this.windowMs
            );
            
            if (validRequests.length === 0) {
                this.requests.delete(userId);
                cleanedCount++;
            } else if (validRequests.length !== timestamps.length) {
                this.requests.set(userId, validRequests);
            }
        }
        
        if (cleanedCount > 0) {
            logger.debug('Rate limiter cleanup', null, {
                cleanedUsers: cleanedCount,
                activeUsers: this.requests.size
            });
        }
    }
    
    /**
     * @returns {Object} 
     */
    getStats() {
        return {
            activeUsers: this.requests.size,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs,
            windowSeconds: Math.floor(this.windowMs / 1000)
        };
    }
    
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.requests.clear();
    }
}

module.exports = RateLimiter;
