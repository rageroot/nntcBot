const fs = require('fs');
const child_process = require('child_process');
const modelBd = require('../models/mySelf');

/**
 * Выводит список выполненных дел
 * @param userId
 * @param userName
 * @returns {Promise<unknown>}
 */
module.exports.list = async (userId, userName) => {
    return new Promise( (resolve, reject)=>{
        const filename = './myself_lists/' + userId + '.txt';
        let toDoList = [];

        fs.readFile(filename, (err, file) =>{
            if(err){
                reject(new Error("У вас нет самооценки"));
            }
            else {
                toDoList = JSON.parse(file);
                toDoList = botDecorator(toDoList);

                toDoList.unshift(userName + ", ты успел натворить:");
                resolve(toDoList.join('\n'));
            }
        });
    });
};

/**
 * Добавляет новое дело в файл и созадет его, если файла нет.
 * @param userId
 * @param userName
 * @param business
 * @returns {Promise<unknown>}
 */
module.exports.new = async (userId, userName, business) => {
    return new Promise( async (resolve, reject)=>{
        const myselfListFile = './myself_lists/' + userId + '.txt';
        let toDoList = [];

        try{
            let myselfListData = await readFile(myselfListFile, "");
            toDoList = JSON.parse(myselfListData);
            toDoList.push(business);
        }catch (err) {
            toDoList.push(business);
        }

        writeFile(myselfListFile, JSON.stringify(toDoList), "Не могу добавить новое дело")
            .then(resolve(userName + ", твое дело учтено!"))
            .catch(err => reject(err));
    });
};

/**
 * Удаляет файл со списком дел
 * @param userId
 * @returns {Promise<unknown>}
 */
module.exports.clear =  async (userId) => { //просто удаляет файл
    return new Promise( (resolve, reject)=> {
        const filename = './myself_lists/' + userId + '.txt';
        fs.unlink(filename, (err) => {
            if (err) {
                reject(new Error("Не могу удалить файл"));
            }
            resolve("Нет у вас больше дел");
        });
    });
}

//Требовался только один раз, по этому заглушка
//потребовался второй раз, но все равно заглушка
module.exports.refactor = async (users) => {
    const message = [];
    users.forEach((user) => {
        const filename = './myself_lists/' + user + '.txt';

        try {
            const file =  fs.readFileSync(filename);
            let toDoList = JSON.parse(file);
            toDoList = toDoList.map((unit) => {
                return {
                    affair: unit,
                    date: Date.now()
                }
            });
            modelBd.refactor(user, toDoList);
            message.push(`${user} ИЗМЕНЕН`);

        }
        catch (err){
            message.push(`${user} не имеет файла`);
        }

    });
    return new Promise( resolve=>{
        resolve(message.join('\n'))});
    //return "Заглушка";

}

/**
 * Генерирует файл с листом самооценки
 * @param userId
 * @returns {Promise<unknown>}
 */
module.exports.getMyselfFile = async (userId) => { //находимся в корне проекта
    return new Promise(async (resolve, reject) => {
        const templateDirectory = `tmp/${userId}_self`; //здесь разобраный шаблон одт tmpPath
        const myselfFile = './myself_lists/' + userId + '.txt'; //здесь лежат наши важные дела filename
        const templateFile = `./${templateDirectory}/content.xml`; //файл с текстовым содержимым одт tmpFile
        let toDoList = [];  //массив, где я формирую будущую верстку

        try {
            await mkDir(templateDirectory);
            await cpTemplate(templateDirectory);
            const myselfFileData = await readFile(myselfFile, "У вас нет самооценки");

            toDoList = JSON.parse(myselfFileData);
            toDoList = fileDecorator(toDoList);   //декорирую под запись в файл
            toDoList.push("</office:text></office:body></office:document-content>");

            let templateFileData = await readFile(templateFile, "Файл шаблона не был создан");
            templateFileData += toDoList.join("");

            await writeFile(templateFile, templateFileData, "Не могу создать файл");
        }
        catch (err) {
            reject(new Error(err.message));
        }
        child_process.exec(`cd ${templateDirectory}; zip -0 -r ../myself_${userId}.odt *`, (err) =>{ //упаковываю одт
            if(err){
                reject(new Error(err.message))
            }
                resolve(`tmp/myself_${userId}.odt`);
        });
    });
}

/**
 * Сборщик мусора после генерации листа самооценок
 * @param userId
 * @returns {Promise<void>}
 */
module.exports.garbageCollector = async (userId) => {
    const tmpPath = `tmp/${userId}_self`;
    const tmpFile = `tmp/myself_${userId}.odt`;
    child_process.exec(`rm -rf ${tmpPath} ${tmpFile}`,(err) => {
        if(err){
            throw new Error("не могу собрать мусор");
        }
    });
}

/**
 * Декоратор вывода листа самооценок в бота
 * @param affairs
 * @returns {*}
 */
function botDecorator(affairs){
    let i = 1;
    return affairs.map((affair) => {
        return `${i++}- ${affair}`;
    });
}

/**
 * Декоратор вывода листа самооценок в файл
 * @param affairs
 * @returns {*}
 */
function fileDecorator(affairs){
    let i = 1;
    return affairs.map((affair) => {
        return `<text:p text:style-name="P${i++}">-${affair}</text:p>`; //одтшная верстка
    });
}


/**
 * Создать папку
 * @param path
 * @returns {Promise<unknown>}
 */
async function mkDir(path){
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (err) => {
            if (err) {
                reject(new Error(`Не могу создать папку ${path}`));
            }
            resolve();
        });
    });
}

/**
 * Копировать файлы шаблона во временную директорию
 * @param pathToTemplate
 * @returns {Promise<unknown>}
 */
async function cpTemplate(pathToTemplate){
    return new Promise((resolve, reject) => {
        child_process.exec(`cp -r odt_templates/myself/* ${pathToTemplate}`, (err) => {
            if (err) {
                reject(new Error(`Не могу скопировать файл шаблонов`));
            }
            resolve();
        });
    });
}

/**
 * вернуть содержимое файла
 * @param path
 * @param errMessage
 * @returns {Promise<unknown>}
 */
async function readFile(path, errMessage){
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if(err){
                 reject(new Error(errMessage));
            }
            else {
                resolve(data);
            }
        });
    });
}

/**
 * Записать файл
 * @param path
 * @param data
 * @param errMessage
 * @returns {Promise<unknown>}
 */
async function writeFile(path, data, errMessage){
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if(err){
                reject(new Error(errMessage));
            }
            resolve();
        });
    });
}