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
         //return 'hello';
     }catch (err) {
         throw new Error(err.message + ' ошибка при создании логов');
     }
}

async function generateUsersLog(path){
    const users = await usersModel.getAllUsers();
    const arrayForCsv = ['userId,status,Name,userName,opener,note'];

    for(const user of users){
        arrayForCsv.push(`${user.userId},${user.status},${user.firstname} ${user.lastname},${user.username},${user.opener},${user.note}`);
    }
    await fs.writeFile(path, arrayForCsv.join('\n'));
}

async function generateUsageLog(path){

}

async function garbageCollector(paths){

}