const fs = require('fs');
const child_process = require('child_process');

module.exports.list = async (userId, userName) => {
    const filename = './myself_lists/' + userId + '.txt';
    let message = "";
    let toDoList = [];
    try {
        const file =  fs.readFileSync(filename);
        toDoList = JSON.parse(file);
        toDoList = botDecorator(toDoList);

    }catch (err){
        message = "Неизвестная ошибка";
    }

    toDoList.unshift(userName + ", ты успел натворить:");
    return new Promise( resolve=>{
        resolve(toDoList.join('\n'))});
};

module.exports.new = async (userId, userName, business) => {
    const filename = './myself_lists/' + userId + '.txt';
    let message = "";
    let toDoList = [];

    try {
        const file =  fs.readFileSync(filename);
        toDoList = JSON.parse(file);
        toDoList.push(business);
        fs.writeFileSync(filename, JSON.stringify(toDoList), 'utf8');
    }
    catch (err){
        toDoList.push(business);
        fs.writeFileSync(filename, JSON.stringify(toDoList), 'utf8');
    }
    message = userName + ", твое дело учтено!";
    return new Promise( resolve=>{
        resolve(message)});
};

module.exports.clear =  async (userId) => { //просто удаляет файл
    const filename = './myself_lists/' + userId + '.txt';
        let message = "Нет у вас больше дел";

        try {
            fs.unlinkSync(filename);
        }
        catch (err){
            message = "Что то пошло не так";
        }

    return new Promise( resolve=>{
        resolve(message)});
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
    const tmpPath = `tmp/${userId}_self`; //здесь разобраный шаблон одт
    const filename = './myself_lists/' + userId + '.txt'; //здесь лежат наши важные дела
    const tmpFile = `./${tmpPath}/content.xml`; //файл с текстовым содержимым одт
    let toDoList = [];  //массив, где я формирую будущую верстку

    try {
        child_process.execSync(`mkdir ${tmpPath}`)  //создаю папку
        child_process.execSync(`cp -r odt_templates/myself/* ${tmpPath}`); //скопировать шаблон для работы
    }
    catch (err){
        return 'Возникли проблемы на файловой системе'
    }

    try {   //получаю список дел и декорирую их под файл
        const file =  fs.readFileSync(filename);
        toDoList = JSON.parse(file);
        toDoList = fileDecorator(toDoList); //формирую правильную верстку для одт
        toDoList.push("</office:text></office:body></office:document-content>");
        //console.log(toDoList);
    }catch (err){
        return "Нет самооценки";
    }

    try{    //Запаковываю в файл шаблона новое содержимое
        let tmpFileContent =  fs.readFileSync(tmpFile); //считываю содержимое файла
        tmpFileContent += toDoList.join("");    //дополняю
        fs.writeFileSync(tmpFile, tmpFileContent, 'utf8');  //засовываю новое содержимое
    }
    catch (err){
        return "Нет файла шаблона"
    }

    try {
        child_process.execSync(`cd ${tmpPath}; zip -0 -r ../myself_${userId}.odt *`); //собираю одт
    }
    catch (err){
        return "Ошибка упаковки файла";
    }

    return `tmp/myself_${userId}.odt`;  //отдаю путь к файлу, для дальнейшей работы
}

module.exports.garbageCollector = async (userId) => { //Сборка мусора после вывода файла самооценки
    const tmpPath = `tmp/${userId}_self`; //здесь разобраный шаблон одт
    const tmpFile = `tmp/myself_${userId}.odt`;
    child_process.execSync(`rm -rf ${tmpPath} ${tmpFile}`);
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

/*
<text:p text:style-name="P1">Myself</text:p><text:p text:style-name="P2">123123</text:p>
<text:p text:style-name="P3">123123</text:p></office:text></office:body></office:document-content>

*

*
*
* */

