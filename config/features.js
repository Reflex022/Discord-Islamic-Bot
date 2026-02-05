/**
 * إعدادات تفعيل/تعطيل الميزات
 */

module.exports = {
    ENABLE_AZKAR: process.env.ENABLE_AZKAR !== 'false',
    ENABLE_DUA: process.env.ENABLE_DUA !== 'false',
    ENABLE_QURAN: process.env.ENABLE_QURAN !== 'false',

    ENABLE_AUTO_RECONNECT: process.env.ENABLE_AUTO_RECONNECT !== 'false',
    ENABLE_STATE_PERSISTENCE: process.env.ENABLE_STATE_PERSISTENCE !== 'false',
    ENABLE_AUTO_CLEANUP: process.env.ENABLE_AUTO_CLEANUP !== 'false',

    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
    ENABLE_INPUT_VALIDATION: process.env.ENABLE_INPUT_VALIDATION !== 'false',
    ENABLE_PERMISSION_CHECK: process.env.ENABLE_PERMISSION_CHECK !== 'false',

    ENABLE_ADMIN_COMMANDS: process.env.ENABLE_ADMIN_COMMANDS === 'true',
    ENABLE_DEBUG_COMMANDS: process.env.ENABLE_DEBUG_COMMANDS === 'true',

    ENABLE_DETAILED_LOGGING: process.env.ENABLE_DETAILED_LOGGING !== 'false',
    ENABLE_ERROR_TRACKING: process.env.ENABLE_ERROR_TRACKING !== 'false',

    ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
    ENABLE_CONNECTION_POOLING: process.env.ENABLE_CONNECTION_POOLING !== 'false',

    MAX_GUILDS: parseInt(process.env.MAX_GUILDS) || 100,
    MAX_CONCURRENT_CONNECTIONS: parseInt(process.env.MAX_CONCURRENT_CONNECTIONS) || 50,

    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,

    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',

    /**
     * Check if a feature is enabled
     * @param {string} featureName - Name of the feature
     * @returns {boolean} True if enabled
     */
    isEnabled(featureName) {
        return this[featureName] === true;
    },

    /**
     * Get all enabled features
     * @returns {Array<string>} Array of enabled feature names
     */
    getEnabledFeatures() {
        return Object.keys(this).filter(key =>
            typeof this[key] === 'boolean' && this[key] === true
        );
    },

    /**
     * Get all disabled features
     * @returns {Array<string>} Array of disabled feature names
     */
    getDisabledFeatures() {
        return Object.keys(this).filter(key =>
            typeof this[key] === 'boolean' && this[key] === false
        );
    },

    /**
     * Get feature configuration summary
     * @returns {Object} Configuration summary
     */
    getSummary() {
        return {
            coreFeatures: {
                azkar: this.ENABLE_AZKAR,
                dua: this.ENABLE_DUA,
                quran: this.ENABLE_QURAN
            },
            systemFeatures: {
                autoReconnect: this.ENABLE_AUTO_RECONNECT,
                statePersistence: this.ENABLE_STATE_PERSISTENCE,
                autoCleanup: this.ENABLE_AUTO_CLEANUP
            },
            securityFeatures: {
                rateLimiting: this.ENABLE_RATE_LIMITING,
                inputValidation: this.ENABLE_INPUT_VALIDATION,
                permissionCheck: this.ENABLE_PERMISSION_CHECK
            },
            limits: {
                maxGuilds: this.MAX_GUILDS,
                maxConcurrentConnections: this.MAX_CONCURRENT_CONNECTIONS
            },
            debug: {
                debugMode: this.DEBUG_MODE,
                verboseLogging: this.VERBOSE_LOGGING
            }
        };
    }
};
