    class Validator {
    /**
     * @param {number} duration
     * @returns {boolean}
     */
    static isValidDuration(duration) {
        return Number.isInteger(duration) &&
            duration >= 30 &&
            duration <= 360;
    }

    /**
     * @param {string} guildId
     * @returns {boolean}
     */
    static isValidGuildId(guildId) {
        return typeof guildId === 'string' &&
            /^\d{17,19}$/.test(guildId);
    }

    /**
     * @param {string} channelId
     * @returns {boolean}
     */
    static isValidChannelId(channelId) {
        return typeof channelId === 'string' &&
            /^\d{17,19}$/.test(channelId);
    }

    /**
     * @param {string} userId
     * @returns {boolean}
     */
    static isValidUserId(userId) {
        return typeof userId === 'string' &&
            /^\d{17,19}$/.test(userId);
    }

    /**
     * @param {string} messageId
     * @returns {boolean}
     */
    static isValidMessageId(messageId) {
        return typeof messageId === 'string' &&
            /^\d{17,19}$/.test(messageId);
    }

    /**
     * @param {string} str
     * @param {number} maxLength
     * @returns {string}
     */
    static sanitizeString(str, maxLength = 2000) {
        if (typeof str !== 'string') return '';
        return str.slice(0, maxLength).trim();
    }

    /**
     * @param {Array} arr
     * @returns {boolean}
     */
    static isValidArray(arr) {
        return Array.isArray(arr) && arr.length > 0;
    }

    /**
     * @param {Object} obj
     * @returns {boolean}
     */
    static isValidObject(obj) {
        return obj !== null &&
            typeof obj === 'object' &&
            !Array.isArray(obj) &&
            Object.keys(obj).length > 0;
    }

    /**
     * @param {number} duration
     * @returns {Object} 
     */
    static validateDuration(duration) {
        if (!Number.isInteger(duration)) {
            return {
                valid: false,
                error: 'المدة يجب أن تكون رقماً صحيحاً'
            };
        }

        if (duration < 30) {
            return {
                valid: false,
                error: 'المدة يجب أن تكون 30 دقيقة على الأقل'
            };
        }

        if (duration > 360) {
            return {
                valid: false,
                error: 'المدة يجب أن تكون 360 دقيقة كحد أقصى (6 ساعات)'
            };
        }

        return { valid: true, error: null };
    }

    /**
     * @param {Object} guild
     * @returns {Object}
     */
    static validateGuild(guild) {
        if (!guild) {
            return {
                valid: false,
                error: 'السيرفر غير موجود'
            };
        }

        if (!this.isValidGuildId(guild.id)) {
            return {
                valid: false,
                error: 'معرف السيرفر غير صالح'
            };
        }

        return { valid: true, error: null };
    }

    /**
     * @param {Object} channel
     * @returns {Object}
     */
    static validateChannel(channel) {
        if (!channel) {
            return {
                valid: false,
                error: 'الالروم غير موجودة'
            };
        }

        if (!this.isValidChannelId(channel.id)) {
            return {
                valid: false,
                error: 'معرف الالروم غير صالح'
            };
        }

        return { valid: true, error: null };
    }

    /**
     * @param {Object} voiceChannel
     * @returns {Object}
     */
    static validateVoiceChannel(voiceChannel) {
        if (!voiceChannel) {
            return {
                valid: false,
                error: 'يجب أن تكون في روم صوتي'
            };
        }

        if (!voiceChannel.isVoiceBased || !voiceChannel.isVoiceBased()) {
            return {
                valid: false,
                error: 'الالروم ليست الروم صوتية'
            };
        }

        return { valid: true, error: null };
    }

    /**
     * @param {Array} data
     * @param {string} dataType
     * @returns {Object}
     */
    static validateJSONData(data, dataType = 'البيانات') {
        if (!this.isValidArray(data)) {
            return {
                valid: false,
                error: `${dataType} فارغة أو غير صالحة`
            };
        }

        return { valid: true, error: null };
    }
}

module.exports = Validator;
