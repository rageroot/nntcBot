const fs = require('fs');

module.exports.list = (userId, userName) => {
    const filename = './myself_lists/' + userId + '.txt';
    let message = "";
    let toDoList = [];
    try {
        const file =  fs.readFileSync(filename);
        toDoList = JSON.parse(file);

    }catch (err){
        message = "Неизвестная ошибка";
    }

    toDoList.unshift(userName + ", ты успел натворить:");
    message = toDoList.join('\n');
    return message;
};

module.exports.new = (userId, userName, business) => {
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
    return message;
};

module.exports.clear = (userId) => { //просто удаляет файл
    const filename = './myself_lists/' + userId + '.txt';
    let message = "Нет у вас больше дел";
    try {
        fs.unlinkSync(filename);
    }
    catch (err){
        message = "Что то пошло не так";
    }
    return message;
}