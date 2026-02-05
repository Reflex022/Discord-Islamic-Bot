const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

/**
 * @param {Client} client 
 * @returns {Promise<boolean>} 
 */
async function deployCommands(client) {
    try {
        const commands = [];
        const commandsPath = path.join(__dirname, '..', '..', 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            logger.error('Commands directory not found', null, { path: commandsPath });
            return false;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    logger.debug('Command data loaded for deployment', null, {
                        name: command.data.name,
                        file: file
                    });
                } else {
                    logger.warn('Invalid command file skipped', null, {
                        file: file,
                        reason: 'Missing data or execute property'
                    });
                }
            } catch (error) {
                logger.error('Failed to load command for deployment', null, {
                    file: file,
                    error: error.message
                });
            }
        }

        if (commands.length === 0) {
            logger.warn('No commands found to deploy');
            return false;
        }

        logger.info('Starting command deployment...', null, {
            commandCount: commands.length
        });

        const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );

        logger.info('Commands deployed successfully', null, {
            deployed: data.length,
            commands: data.map(cmd => cmd.name).join(', ')
        });

        return true;

    } catch (error) {
        logger.error('Failed to deploy commands', null, {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}

/**
 * @param {Client} client 
 * @param {string} guildId 
 * @returns {Promise<boolean>} 
 */
async function deployGuildCommands(client, guildId) {
    try {
        const commands = [];
        const commandsPath = path.join(__dirname, '..', '..', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            } catch (error) {
                logger.error('Failed to load command for guild deployment', null, {
                    file: file,
                    error: error.message
                });
            }
        }

        if (commands.length === 0) {
            logger.warn('No commands found to deploy to guild', null, { guildId });
            return false;
        }

        logger.info('Starting guild command deployment...', null, {
            guildId,
            commandCount: commands.length
        });

        const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            { body: commands }
        );

        logger.info('Guild commands deployed successfully', null, {
            guildId,
            deployed: data.length
        });

        return true;

    } catch (error) {
        logger.error('Failed to deploy guild commands', null, {
            guildId,
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}

module.exports = {
    deployCommands,
    deployGuildCommands
};
