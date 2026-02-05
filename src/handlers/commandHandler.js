const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

/**
 * @param {Client} client 
 */
function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', '..', 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath);
        logger.warn('Commands directory created', null, { path: commandsPath });
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    let loadedCount = 0;
    let failedCount = 0;

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                loadedCount++;
                logger.debug('Command loaded', null, {
                    name: command.data.name,
                    file: file
                });
            } else {
                logger.warn('Invalid command file', null, {
                    file: file,
                    reason: 'Missing data or execute property'
                });
                failedCount++;
            }
        } catch (error) {
            logger.error('Failed to load command', null, {
                file: file,
                error: error.message
            });
            failedCount++;
        }
    }

    logger.info('Commands loaded', null, {
        loaded: loadedCount,
        failed: failedCount,
        total: commandFiles.length
    });
}

module.exports = {
    loadCommands
};
