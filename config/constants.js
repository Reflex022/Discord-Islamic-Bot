/**
 * جميع الرسائل المستخدمة داخل البوت
 */

module.exports = {
    DURATIONS: {
        MIN_INTERVAL_MINUTES: 30,
        MAX_INTERVAL_MINUTES: 360,
        ONE_DAY_MS: 24 * 60 * 60 * 1000,
        ONE_HOUR_MS: 60 * 60 * 1000,
        ONE_MINUTE_MS: 60 * 1000,
        SAVE_STATE_INTERVAL_MS: 60 * 1000,
        RECONNECT_CHECK_INTERVAL_MS: 60 * 1000,
        CLEANUP_INTERVAL_MS: 30 * 60 * 1000, 
        VOICE_MONITOR_INTERVAL_MS: 30 * 1000,
        RECONNECT_DELAY_MS: 2000,
        SURAH_TRANSITION_DELAY_MS: 2000
    },
    
    LIMITS: {
        MAX_RECONNECT_ATTEMPTS: 3,
        MAX_RETRIES: 3, 
        LOG_RETENTION_DAYS: 7 
    },
    
    COLORS: {
        SUCCESS: 0x2ECC71,
        ERROR: 0xE74C3C,
        WARNING: 0xF39C12,
        INFO: 0x3498DB,
        AZKAR: 0x27AE60,
        DUA: 0x3498DB,
        QURAN: 0x9B59B6
    },
    
    EMOJIS: {
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        LOADING: '⏳',
        STOP: '⏹️',
        QURAN: '📖',
        AZKAR: '📿',
        DUA: '🤲',
        RADIO: '📻',
        MOSQUE: '🕌',
        KAABA: '🕋',
        STAR: '🌟',
        SPARKLES: '✨',
        TARGET: '🎯',
        CLOCK: '⏰',
        BOOK: '📚',
        LIGHT: '💡',
        CLEAN: '🧹',
        RECYCLE: '♻️'
    },
    
    PATHS: {
        DATA_DIR: './data',
        STORAGE_DIR: './storage',
        LOGS_DIR: './logs',
        COMMANDS_DIR: './commands',
        UTILS_DIR: './utils',
        MANAGERS_DIR: './managers',
        AZKAR_FILE: './data/azkar.json',
        DUA_FILE: './data/dua.json',
        QURAN_FILE: './data/mp3quran.json',
        STATE_FILE: './storage/botState.json',
        STATE_BACKUP_FILE: './storage/botState.json.backup'
    },
    
    DISCORD_ERROR_CODES: {
        UNKNOWN_MESSAGE: 10008,
        UNKNOWN_CHANNEL: 10003,
        UNKNOWN_INTERACTION: 10062,
        MISSING_PERMISSIONS: 50013,
        CANNOT_SEND_DM: 50007,
        INVALID_FORM_BODY: 50035,
        MISSING_ACCESS: 50001,
        INTERACTION_ALREADY_ACKNOWLEDGED: 40060
    },
    
    VOICE_STATUS: {
        SIGNALLING: 'signalling',
        CONNECTING: 'connecting',
        READY: 'ready',
        DISCONNECTED: 'disconnected',
        DESTROYED: 'destroyed'
    },
    
    AUDIO_STATUS: {
        IDLE: 'idle',
        BUFFERING: 'buffering',
        PLAYING: 'playing',
        PAUSED: 'paused',
        AUTO_PAUSED: 'autopaused'
    },
    
    RADIO_URLS: {
        CAIRO: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
        SAUDI: 'http://www.quran-radio.org:8002/;'
    },
    
    MESSAGES: {
        BOT_READY: '🤖 Bot ready! Logged in as',
        AZKAR_STARTED: 'تم بدء خدمة ارسال الأذكار بنجاح',
        DUA_STARTED: 'تم بدء خدمة ارسال الأدعية بنجاح',
        QURAN_STARTED: 'تم بدء تشغيل القرآن الكريم',
        AZKAR_STOPPED: 'تم إيقاف خدمة الأذكار',
        DUA_STOPPED: 'تم إيقاف خدمة الأدعية',
        QURAN_STOPPED: 'تم إيقاف تشغيل القرآن الكريم',
        NO_PERMISSION: 'ليس لديك صلاحية لاستخدام هذا الأمر',
        NOT_IN_VOICE: 'يجب أن تكون في روم صوتي لتشغيل الإذاعة',
        ALREADY_ACTIVE: 'يوجد بالفعل خدمة نشطة في هذا السيرفر',
        ERROR_OCCURRED: 'حدث خطأ أثناء تنفيذ الأمر',
        DATA_LOAD_FAILED: 'فشل تحميل البيانات'
    },
    
    REQUIRED_PERMISSIONS: {
        ADMINISTRATOR: 'Administrator',
        SEND_MESSAGES: 'SendMessages',
        CONNECT: 'Connect',
        SPEAK: 'Speak'
    }
};
