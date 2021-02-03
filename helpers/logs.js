const usersModel = require('../models/users');
const logsModel = require('../models/logs');
const fs = require('fs').promises;

/**
 * Возрващает пути к подготовленным логам
 * @param userId
 * @returns {Promise<string[]>}
 */
module.exports.getLogs = async (userId) => {
    const pathToUsersLogs = `tmp/usersLog${userId}.csv`;
    const pathToUsageLogs = `tmp/usageLog${userId}.csv`;
     try {
        await generateUsersLog(pathToUsersLogs);
        await generateUsageLog(pathToUsageLogs);
        return [pathToUsersLogs, pathToUsageLogs];
     }catch (err) {
         throw new Error(err.message + ' ошибка при создании логов');
     }
}

/**
 * Генерирует лог пользователей
 * @param path
 * @returns {Promise<void>}
 */
async function generateUsersLog(path){
    const users = await usersModel.getAllUsers();
    const arrayForCsv = ['userId,status,Name,userName,opener,note'];

    for(const user of users){
        arrayForCsv.push(`${user.userId},${user.status},${user.firstname} ${user.lastname},${user.username},${user.opener},${user.note.replace(/,/g,'.')}`);
    }
    await fs.writeFile(path, arrayForCsv.join('\n'));
}

/**
 * генерирует лог использования бота
 * @param path
 * @returns {Promise<void>}
 */
async function generateUsageLog(path){
    const logs = await logsModel.getAllLogs();
    const arrayForCsv = ['userId,username,realname,time,messageType,message,note'];

    for(const log of logs){
        const date = new Date(log.time);
        date.setHours(date.getHours());
        arrayForCsv.push(`${log.userId},${log.username},${log.realname},${date},${log.messageType},${log.message},${log.note.replace(/,/g,'.')}`);
    }
    await fs.writeFile(path, arrayForCsv.join('\n'));
}

/**
 * Сборщик мусора
 * @param paths
 * @returns {Promise<void>}
 */
module.exports.garbageCollector = async (paths) => {
    try {
        await fs.unlink(paths[0]);
        await fs.unlink(paths[1]);
    }catch (err) {
        throw new Error(err.message + 'не могу собрать мусор в модуле logs');
    }

}