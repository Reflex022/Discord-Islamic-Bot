/**
 * Error Codes System
 */

module.exports = {
    ERR_NO_PERMISSION: {
        code: 1001,
        message: 'ليس لديك صلاحية لاستخدام هذا الأمر',
        severity: 'warning'
    },
    ERR_BOT_NO_PERMISSION: {
        code: 1002,
        message: 'البوت لا يملك الصلاحيات المطلوبة',
        severity: 'error'
    },
    ERR_MISSING_MANAGE_MESSAGES: {
        code: 1003,
        message: 'البوت يحتاج صلاحية إدارة الرسائل',
        severity: 'error'
    },
    ERR_NOT_IN_VOICE: {
        code: 2001,
        message: 'يجب أن تكون في روم صوتي',
        severity: 'warning'
    },
    ERR_VOICE_CONNECTION_FAILED: {
        code: 2002,
        message: 'فشل الاتصال بالروم الصوتي',
        severity: 'error'
    },
    ERR_VOICE_DISCONNECTED: {
        code: 2003,
        message: 'تم قطع الاتصال الصوتي',
        severity: 'warning'
    },
    ERR_AUDIO_PLAYBACK_FAILED: {
        code: 2004,
        message: 'فشل تشغيل الصوت',
        severity: 'error'
    },
    ERR_ALREADY_ACTIVE: {
        code: 3001,
        message: 'الخدمة نشطة بالفعل في هذا السيرفر',
        severity: 'warning'
    },
    ERR_NOT_ACTIVE: {
        code: 3002,
        message: 'لا توجد خدمة نشطة في هذا السيرفر',
        severity: 'warning'
    },
    ERR_CHANNEL_NOT_FOUND: {
        code: 3003,
        message: 'الالروم غير موجودة',
        severity: 'error'
    },
    ERR_GUILD_NOT_FOUND: {
        code: 3004,
        message: 'السيرفر غير موجود',
        severity: 'error'
    },
    ERR_DATA_LOAD_FAILED: {
        code: 4001,
        message: 'فشل تحميل البيانات',
        severity: 'critical'
    },
    ERR_DATA_EMPTY: {
        code: 4002,
        message: 'البيانات فارغة أو غير صالحة',
        severity: 'critical'
    },
    ERR_STATE_SAVE_FAILED: {
        code: 4003,
        message: 'فشل حفظ الحالة',
        severity: 'error'
    },
    ERR_STATE_RESTORE_FAILED: {
        code: 4004,
        message: 'فشل استعادة الحالة',
        severity: 'error'
    },
    ERR_FILE_NOT_FOUND: {
        code: 4005,
        message: 'الملف غير موجود',
        severity: 'error'
    },
    ERR_INVALID_JSON: {
        code: 4006,
        message: 'صيغة JSON غير صالحة',
        severity: 'error'
    },
    ERR_INVALID_DURATION: {
        code: 5001,
        message: 'المدة غير صالحة',
        severity: 'warning'
    },
    ERR_INVALID_INPUT: {
        code: 5002,
        message: 'المدخلات غير صالحة',
        severity: 'warning'
    },
    ERR_MISSING_PARAMETER: {
        code: 5003,
        message: 'معامل مطلوب مفقود',
        severity: 'warning'
    },
    ERR_DISCORD_API: {
        code: 6001,
        message: 'خطأ في Discord API',
        severity: 'error'
    },
    ERR_INTERACTION_EXPIRED: {
        code: 6002,
        message: 'انتهت صلاحية التفاعل',
        severity: 'warning'
    },
    ERR_RATE_LIMITED: {
        code: 6003,
        message: 'تم تجاوز حد الطلبات',
        severity: 'warning'
    },
    ERR_UNKNOWN: {
        code: 7001,
        message: 'خطأ غير معروف',
        severity: 'error'
    },
    ERR_TIMEOUT: {
        code: 7002,
        message: 'انتهت مهلة العملية',
        severity: 'error'
    },
    ERR_MEMORY: {
        code: 7003,
        message: 'خطأ في الذاكرة',
        severity: 'critical'
    },

    /**
     * Format error message with code
     * @param {Object} error - Error object from this module
     * @param {Object} metadata - Additional metadata
     * @returns {string} Formatted error message
     */
    format: function (error, metadata = {}) {
        let message = `❌ [${error.code}] ${error.message}`;

        if (metadata.details) {
            message += `\n${metadata.details}`;
        }

        return message;
    },

    /**
     * Get error by code
     * @param {number} code - Error code
     * @returns {Object|null} Error object or null
     */
    getByCode: function (code) {
        for (const key in this) {
            if (this[key].code === code) {
                return this[key];
            }
        }
        return null;
    }
};
