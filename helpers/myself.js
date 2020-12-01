const fs = require('fs');

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

module.exports.file = async (userId, userName) => {
    return "Когда то это будет работать. Наверно. Не точно.";
}

/*Декораторы для вывода в файл и в бота*/
function botDecorator(affairs){
    let i = 1;
    return affairs.map((affair) => {
        return `${i++}- ${affair}`;
    });
}

function fileDecorator(affairs){
    return affairs.map((affair) => {
        return `- ${affair}`;
    });
}