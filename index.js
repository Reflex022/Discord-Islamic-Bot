require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
const logger = require('./utils/logger');
const { loadJSONFile } = require('./utils/discordHelpers');

if (!process.env.DISCORD_BOT_TOKEN) {
    logger.error('DISCORD_BOT_TOKEN is not set in environment variables');
    process.exit(1);
}

if (!process.env.DISCORD_CLIENT_ID) {
    logger.error('DISCORD_CLIENT_ID is not set in environment variables');
    process.exit(1);
}

const { loadCommands } = require('./src/handlers/commandHandler');
const { registerEvents } = require('./src/handlers/eventHandler');
const { saveState } = require('./src/services/stateManager');
const { getAvailableZikr, getAvailableDua, markZikrAsUsed, markDuaAsUsed } = require('./src/services/dataManager');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.commands = new Collection();
client.voiceConnections = new Collection();
client.activeDuas = new Collection();
client.activeAzkar = new Collection();
client.recentAzkar = new Collection();
client.recentDuas = new Collection();
client.systemIntervals = [];
client.commandCooldowns = new Collection();

const BOT_CONFIG = {
    MAX_MEMORY_MB: 512,
    COMMAND_COOLDOWN_MS: 3000,
    MEMORY_CHECK_INTERVAL_MS: 60000,
    CLEANUP_INTERVAL_MS: 15 * 60 * 1000,
    CACHE_TTL_MS: 24 * 60 * 60 * 1000,
};
client.config = BOT_CONFIG;

const ConnectionPool = require('./managers/ConnectionPool');
client.connectionPool = new ConnectionPool(100);

const { ResourceManager } = require('./utils/resourceManager');
client.resourceManager = new ResourceManager(client);

const RateLimiter = require('./utils/rateLimiter');
client.rateLimiter = new RateLimiter(10, 60000);


const azkarData = loadJSONFile(path.join(__dirname, 'data', 'azkar.json'), []);
const duaData = loadJSONFile(path.join(__dirname, 'data', 'dua.json'), []);
const quranData = loadJSONFile(path.join(__dirname, 'data', 'mp3quran.json'), []);


if (azkarData.length === 0 || duaData.length === 0) {
    logger.error('Failed to load required data files', null, {
        azkarCount: azkarData.length,
        duaCount: duaData.length
    });
    process.exit(1);
}

client.data = {
    azkar: azkarData,
    duas: duaData,
    quran: quranData
};



client.getAvailableZikr = (azkarData, guildId) => getAvailableZikr(client, azkarData, guildId);
client.getAvailableDua = (duaData, guildId) => getAvailableDua(client, duaData, guildId);
client.markZikrAsUsed = (zikrId, guildId) => markZikrAsUsed(client, zikrId, guildId);
client.markDuaAsUsed = (duaId, guildId) => markDuaAsUsed(client, duaId, guildId);
client.saveCurrentState = () => saveState(client);

loadCommands(client);

registerEvents(client);

function cleanup() {


    client.systemIntervals.forEach(intervalId => clearInterval(intervalId));


    client.activeAzkar.forEach(info => {
        if (info.interval) clearInterval(info.interval);
    });


    client.activeDuas.forEach(info => {
        if (info.interval) clearInterval(info.interval);
    });


    if (client.connectionPool) {
        client.connectionPool.closeAll();
    }

    if (client.rateLimiter) {
        client.rateLimiter.destroy();
    }

    saveState(client);

}

process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', null, {
        reason: reason?.message || String(reason),
        stack: reason?.stack
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - shutting down', null, {
        error: error.message,
        stack: error.stack
    });

    try {
        cleanup();
    } catch (cleanupError) {
    }

    process.exit(1);
});

client.on('error', (error) => {
    logger.error('Discord client error', null, {
        error: error.message,
        stack: error.stack
    });
});

client.on('warn', (warning) => {
    logger.warn('Discord client warning', null, { warning });
});

client.on('shardError', (error, shardId) => {
    logger.error('Shard error', null, {
        shardId,
        error: error.message,
        stack: error.stack
    });
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    logger.error('Failed to login', null, {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

logger.info('Bot starting...', null, {
    nodeVersion: process.version,
    platform: process.platform
});
