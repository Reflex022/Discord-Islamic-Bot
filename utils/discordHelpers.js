const logger = require('./logger');

async function safeReply(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(options);
        } else {
            return await interaction.reply(options);
        }
    } catch (error) {
        const guildId = interaction.guildId;
        
        switch (error.code) {
            case 50013: 
                logger.error('Missing permissions to reply', guildId, {
                    commandName: interaction.commandName,
                    error: error.message,
                    code: error.code
                });
                break;
                
            case 10062: 
                logger.warn('Interaction expired', guildId, {
                    commandName: interaction.commandName,
                    code: error.code
                });
                break;
                
            case 40060: 
                logger.warn('Interaction already acknowledged', guildId, {
                    commandName: interaction.commandName,
                    code: error.code
                });
                break;
                
            default:
                logger.error('Failed to reply to interaction', guildId, {
                    commandName: interaction.commandName,
                    code: error.code,
                    error: error.message
                });
        }
        
        return null;
    }
}


async function safeSend(channel, options) {
    try {
        return await channel.send(options);
    } catch (error) {
        const guildId = channel.guildId;
        
        switch (error.code) {
            case 50013: 
                logger.error('Missing permissions to send message', guildId, {
                    channelId: channel.id,
                    error: error.message,
                    code: error.code
                });
                break;
                
            case 50035: 
                logger.error('Invalid message format', guildId, {
                    channelId: channel.id,
                    error: error.message,
                    code: error.code
                });
                break;
                
            case 10003: 
                logger.error('Channel not found', guildId, {
                    channelId: channel.id,
                    code: error.code
                });
                break;
                
            case 50001: 
                logger.error('Missing access to channel', guildId, {
                    channelId: channel.id,
                    code: error.code
                });
                break;
                
            default:
                logger.error('Failed to send message', guildId, {
                    channelId: channel.id,
                    code: error.code,
                    error: error.message
                });
        }
        
        return null;
    }
}


async function safeDelete(message) {
    try {
        return await message.delete();
    } catch (error) {
        if (error.code === 10008) {
            logger.debug('Message already deleted', message.guildId, {
                messageId: message.id
            });
        } else if (error.code === 50013) {
            logger.warn('Missing permissions to delete message', message.guildId, {
                messageId: message.id,
                code: error.code
            });
        } else {
            logger.error('Failed to delete message', message.guildId, {
                messageId: message.id,
                code: error.code,
                error: error.message
            });
        }
        return null;
    }
}


async function safeSendDM(user, options) {
    try {
        const dmChannel = await user.createDM();
        return await dmChannel.send(options);
    } catch (error) {
        if (error.code === 50007) {
            logger.warn('Cannot send DM to user (DMs disabled)', null, {
                userId: user.id,
                code: error.code
            });
        } else {
            logger.error('Failed to send DM', null, {
                userId: user.id,
                code: error.code,
                error: error.message
            });
        }
        return null;
    }
}


function loadJSONFile(filePath, defaultValue = []) {
    const fs = require('fs');
    
    try {
        if (!fs.existsSync(filePath)) {
            logger.error('File not found', null, { filePath });
            return defaultValue;
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        if (!fileContent || fileContent.trim().length === 0) {
            logger.error('File is empty', null, { filePath });
            return defaultValue;
        }
        
        const data = JSON.parse(fileContent);
        
        if (!Array.isArray(data)) {
            logger.error('Invalid data format (not an array)', null, { 
                filePath,
                dataType: typeof data
            });
            return defaultValue;
        }
        
        logger.debug('File loaded successfully', null, { 
            filePath, 
            itemCount: data.length 
        });
        
        return data;
        
    } catch (error) {
        logger.error('Failed to load JSON file', null, {
            filePath,
            error: error.message,
            stack: error.stack
        });
        return defaultValue;
    }
}

function saveJSONFile(filePath, data, retryCount = 0) {
    const fs = require('fs');
    const path = require('path');
    const MAX_RETRIES = 3;
    
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (fs.existsSync(filePath)) {
            const backupPath = filePath + '.backup';
            fs.copyFileSync(filePath, backupPath);
        }
        
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonString, 'utf8');
        
        const savedContent = fs.readFileSync(filePath, 'utf8');
        if (savedContent !== jsonString) {
            throw new Error('File content mismatch after save');
        }
        
        logger.debug('File saved successfully', null, { filePath });
        return true;
        
    } catch (error) {
        logger.error('Failed to save JSON file', null, {
            filePath,
            error: error.message,
            retryCount
        });
        
        if (retryCount < MAX_RETRIES) {
            logger.warn('Retrying file save', null, { 
                attempt: retryCount + 1,
                maxRetries: MAX_RETRIES 
            });
            
            const delay = 1000 * (retryCount + 1);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(saveJSONFile(filePath, data, retryCount + 1));
                }, delay);
            });
        } else {
            logger.error('All save attempts failed', null, {
                filePath,
                maxRetries: MAX_RETRIES
            });
            
            const backupPath = filePath + '.backup';
            if (fs.existsSync(backupPath)) {
                try {
                    fs.copyFileSync(backupPath, filePath);
                    logger.info('Restored from backup', null, { filePath });
                } catch (restoreError) {
                    logger.error('Failed to restore backup', null, {
                        filePath,
                        error: restoreError.message
                    });
                }
            }
            
            return false;
        }
    }
}

module.exports = {
    safeReply,
    safeSend,
    safeDelete,
    safeSendDM,
    loadJSONFile,
    saveJSONFile
};
