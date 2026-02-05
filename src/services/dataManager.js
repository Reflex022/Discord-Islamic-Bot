
const logger = require('../../utils/logger');

/**
 * @param {Client} client 
 * @param {string} guildId 
 */
function cleanOldEntries(client, guildId) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (client.recentAzkar.has(guildId)) {
        const recentAzkar = client.recentAzkar.get(guildId);
        const filteredAzkar = recentAzkar.filter(item => (now - item.timestamp) < twentyFourHours);
        client.recentAzkar.set(guildId, filteredAzkar);
    }

    if (client.recentDuas.has(guildId)) {
        const recentDuas = client.recentDuas.get(guildId);
        const filteredDuas = recentDuas.filter(item => (now - item.timestamp) < twentyFourHours);
        client.recentDuas.set(guildId, filteredDuas);
    }
}

/**
 * @param {Client} client 
 */
function cleanupOldData(client) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    let cleanedAzkar = 0;
    let cleanedDuas = 0;
    
    client.recentAzkar.forEach((items, guildId) => {
        const filtered = items.filter(item => (now - item.timestamp) < twentyFourHours);
        if (filtered.length === 0) {
            client.recentAzkar.delete(guildId);
            cleanedAzkar++;
        } else if (filtered.length !== items.length) {
            client.recentAzkar.set(guildId, filtered);
            cleanedAzkar++;
        }
    });
    
    client.recentDuas.forEach((items, guildId) => {
        const filtered = items.filter(item => (now - item.timestamp) < twentyFourHours);
        if (filtered.length === 0) {
            client.recentDuas.delete(guildId);
            cleanedDuas++;
        } else if (filtered.length !== items.length) {
            client.recentDuas.set(guildId, filtered);
            cleanedDuas++;
        }
    });
    
    if (cleanedAzkar > 0 || cleanedDuas > 0) {
        logger.info('Cleaned old data', null, { 
            azkarGuilds: cleanedAzkar, 
            duasGuilds: cleanedDuas 
        });
    }
}

/**
 * @param {Client} client 
 * @param {Array} azkarData 
 * @param {string} guildId 
 * @returns {Object} 
 */
function getAvailableZikr(client, azkarData, guildId) {
    cleanOldEntries(client, guildId);
    
    const recentAzkar = client.recentAzkar.get(guildId) || [];
    const usedIds = recentAzkar.map(item => item.id);
    
    const availableAzkar = azkarData.filter(zikr => !usedIds.includes(zikr.id));
    
    if (availableAzkar.length === 0) {
        client.recentAzkar.set(guildId, []);
        return azkarData[Math.floor(Math.random() * azkarData.length)];
    }
    
    return availableAzkar[Math.floor(Math.random() * availableAzkar.length)];
}

/**
 * @param {Client} client 
 * @param {Array} duaData 
 * @param {string} guildId 
 * @returns {Object} 
 */
function getAvailableDua(client, duaData, guildId) {
    cleanOldEntries(client, guildId);
    
    const recentDuas = client.recentDuas.get(guildId) || [];
    const usedIds = recentDuas.map(item => item.id);
    
    const availableDuas = duaData.filter(dua => !usedIds.includes(dua.id));
    
    if (availableDuas.length === 0) {
        client.recentDuas.set(guildId, []);
        return duaData[Math.floor(Math.random() * duaData.length)];
    }
    
    return availableDuas[Math.floor(Math.random() * availableDuas.length)];
}

/**
 * @param {Client} client 
 * @param {string} zikrId 
 * @param {string} guildId 
 */
function markZikrAsUsed(client, zikrId, guildId) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    const recentAzkar = client.recentAzkar.get(guildId) || [];
    const filtered = recentAzkar.filter(item => (now - item.timestamp) < twentyFourHours);
    filtered.push({ id: zikrId, timestamp: now });
    
    client.recentAzkar.set(guildId, filtered);
}

/**
 * @param {Client} client 
 * @param {string} duaId 
 * @param {string} guildId 
 */
function markDuaAsUsed(client, duaId, guildId) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    const recentDuas = client.recentDuas.get(guildId) || [];
    const filtered = recentDuas.filter(item => (now - item.timestamp) < twentyFourHours);
    filtered.push({ id: duaId, timestamp: now });
    
    client.recentDuas.set(guildId, filtered);
}

module.exports = {
    cleanOldEntries,
    cleanupOldData,
    getAvailableZikr,
    getAvailableDua,
    markZikrAsUsed,
    markDuaAsUsed
};
