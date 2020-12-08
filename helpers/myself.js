const fs = require('fs');
const child_process = require('child_process');

module.exports.list = async (userId, userName) => {
    return new Promise( (resolve, reject)=>{
        const filename = './myself_lists/' + userId + '.txt';
        let toDoList = [];

        fs.readFile(filename, (err, file) =>{
            if(err){
                reject(new Error("У вас нет самооценки"));
            }
            toDoList = JSON.parse(file);
            toDoList = botDecorator(toDoList);

            toDoList.unshift(userName + ", ты успел натворить:");
            resolve(toDoList.join('\n'))
        });
    });
};

module.exports.new = async (userId, userName, business) => {
    return new Promise( (resolve, reject)=>{
        const filename = './myself_lists/' + userId + '.txt';
        let toDoList = [];

        fs.readFile(filename, (err, file) => {
            if(err){
                toDoList.push(business);
            }else {
                toDoList = JSON.parse(file);
                toDoList.push(business);
            }
            fs.writeFile(filename, JSON.stringify(toDoList), (err) => {
                if(err){
                    reject(new Error("Не могу записать файл"))
                }
                resolve(userName + ", твое дело учтено!");
            });
        });
    });
};

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
module.exports.refactor = async (users) => {
    /*const message = [];
    users.forEach(user => {
        const filename = './myself_lists/' + user + '.txt';

        try {
            const file =  fs.readFileSync(filename);
            let toDoList = JSON.parse(file);
            toDoList = toDoList.map(unit => {
                return unit.substring(unit.indexOf(' ', 0)).trim();
            });
            fs.writeFileSync(filename, JSON.stringify(toDoList), 'utf8');
            message.push(`${user} ИЗМЕНЕН`);
        }
        catch (err){
            message.push(`${user} не имеет файла`);
        }

    });
    return new Promise( resolve=>{
        resolve(message.join('\n'))});*/
    return "Заглушка";

}

module.exports.file = async (userId) => { //находимся в корне проекта
    return new Promise((resolve, reject) => {
        const tmpPath = `tmp/${userId}_self`; //здесь разобраный шаблон одт
        const filename = './myself_lists/' + userId + '.txt'; //здесь лежат наши важные дела
        const tmpFile = `./${tmpPath}/content.xml`; //файл с текстовым содержимым одт
        let toDoList = [];  //массив, где я формирую будущую верстку

        fs.mkdir(tmpPath, (err) => {
            if(err){
                reject(new Error(`Не могу создать папку ${tmpPath}`));
            }
            child_process.exec(`cp -r odt_templates/myself/* ${tmpPath}`, (err) =>{
                if(err){
                    reject(new Error(`Не могу скопировать файл шаблонов`));
                }
                fs.readFile(filename, (err, data) => { //получаю список дел
                    if (err) {
                        reject(new Error("У вас нет самооценки"));
                    }
                    toDoList = JSON.parse(data);
                    toDoList = fileDecorator(toDoList);   //декорирую под запись в файл
                    toDoList.push("</office:text></office:body></office:document-content>");
                    fs.readFile(tmpFile, (err, tmpFileContent) => { //запаковываю в файл шаблона новое содержимое
                        if (err) {
                            reject(new Error("Файл шаблона не был создан"));
                        }
                        tmpFileContent += toDoList.join("");
                        fs.writeFile(tmpFile, tmpFileContent, (err) => {
                            if (err) {
                                reject(new Error( "Не могу создать файл =/"));
                            }
                            child_process.exec(`cd ${tmpPath}; zip -0 -r ../myself_${userId}.odt *`, (err) =>{ //упаковываю одт
                                resolve(`tmp/myself_${userId}.odt`);
                            });
                        });  //отдаю путь к файлу, для дальнейшей работы*/
                    });
                });
            });
        });
    });
}

module.exports.garbageCollector = async (userId) => { //Сборка мусора после вывода файла самооценки
    const tmpPath = `tmp/${userId}_self`; //здесь разобраный шаблон одт
    const tmpFile = `tmp/myself_${userId}.odt`;
    child_process.exec(`rm -rf ${tmpPath} ${tmpFile}`,(err) => {
        if(err){
            throw new Error("не могу собрать мусор");
        }
    });
}
//Запаковать: zip file.odt -r *
/*Декораторы для вывода в файл и в бота*/
function botDecorator(affairs){
    let i = 1;
    return affairs.map((affair) => {
        return `${i++}- ${affair}`;
    });
}

function fileDecorator(affairs){
    let i = 1;
    return affairs.map((affair) => {
        return `<text:p text:style-name="P${i++}">-${affair}</text:p>`; //одтшная верстка
    });
}


