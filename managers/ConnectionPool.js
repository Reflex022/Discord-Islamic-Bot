const { joinVoiceChannel } = require('@discordjs/voice');
const logger = require('../utils/logger');

class ConnectionPool {
  constructor(maxConnections = 50) {
    this.connections = new Map();
    this.maxConnections = maxConnections;
    this.inactivityTimeout = 5 * 60 * 1000;
  }

  /**
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {string} adapterCreator 
   * @returns {Promise<VoiceConnection>} 
   */
  async getConnection(guildId, channelId, adapterCreator) {
    if (this.connections.has(guildId)) {
      const entry = this.connections.get(guildId);
      entry.lastUsed = Date.now();
      logger.debug('إعادة استخدام اتصال موجود', guildId);
      return entry.connection;
    }

    if (this.connections.size >= this.maxConnections) {
      throw new Error(`تم الوصول للحد الأقصى من الاتصالات (${this.maxConnections})`);
    }
    const connection = await this.createConnection(guildId, channelId, adapterCreator);
    this.connections.set(guildId, {
      connection,
      lastUsed: Date.now()
    });
    logger.debug('تم إنشاء اتصال جديد', guildId, { total: this.connections.size });
    return connection;
  }

  /**
   * @param {string} guildId 
   * @param {string} channelId 
   * @param {string} adapterCreator 
   * @returns {VoiceConnection} 
   */
  createConnection(guildId, channelId, adapterCreator) {
    try {
      const connection = joinVoiceChannel({
        channelId: channelId,
        guildId: guildId,
        adapterCreator: adapterCreator,
      });
      return connection;
    } catch (error) {
      logger.error('فشل إنشاء الاتصال الصوتي', guildId, { error: error.message });
      throw new Error('فشل الاتصال بالالروم الصوتية. يرجى المحاولة مرة أخرى.');
    }
  }

  /**
   * @param {string} guildId 
   * @returns {boolean} 
   */
  removeConnection(guildId) {
    const entry = this.connections.get(guildId);
    if (entry) {
      try {
        entry.connection.destroy();
      } catch (error) {
        logger.warn('خطأ أثناء إغلاق الاتصال', guildId, { error: error.message });
      }
      this.connections.delete(guildId);
      logger.debug('تم إزالة اتصال', guildId);
      return true;
    }
    return false;
  }

  /**
   * @returns {number} 
   */
  cleanupInactive() {
    const now = Date.now();
    let cleaned = 0;

    for (const [guildId, entry] of this.connections) {
      if (now - entry.lastUsed > this.inactivityTimeout) {
        this.removeConnection(guildId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('تم تنظيف اتصالات غير نشطة', null, { count: cleaned });
    }
    return cleaned;
  }

  /**
   * إغلاق جميع الاتصالات
   */
  closeAll() {
    logger.info('إغلاق جميع الاتصالات', null, { count: this.connections.size });
    for (const [guildId, entry] of this.connections) {
      try {
        entry.connection.destroy();
      } catch (error) {
        logger.warn('خطأ أثناء إغلاق اتصال', guildId, { error: error.message });
      }
    }
    this.connections.clear();
  }

  /**
   * @returns {number} 
   */
  getActiveCount() {
    return this.connections.size;
  }
}

module.exports = ConnectionPool;
