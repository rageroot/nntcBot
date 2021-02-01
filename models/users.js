const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    showDate: {type: Boolean, default: false},
    status: {type: String, default: "student"},
    username: {type: String, default: "null"},
    firstname: {type: String, default: "null"},
    lastname: {type: String, default: "null"},
    note: {type: String, default: ""},
    opener: {type: Boolean, default: false}
});

const Users = mongoose.model('user', usersSchema);

/**
 * Получает данные из базы
 * @param userId
 */
module.exports.get = (userId) => {
    return new Promise(resolve => {
        Users.findOne({userId: userId}, (err, data) => {
            resolve(data);
        });
    });
}

/**
 * Изменяет флаг вывода даты в базе данных
 * @param userId
 * @param show {boolean}, true- выводить, false- не выводить
 * @returns {Promise<void>}
 */
module.exports.dateDisplay = async (userId, show) => {
    try {
        const result = await Users.updateOne({userId: userId}, {showDate: show});
        return result.nModified;
    } catch (err) {
        throw new Error("Не могу изменить данные в базе");
    }
}

/**
 * Добавить нового пользователя в базу
 * @param {userId, username, firstName, lastName}
 * @returns {Promise<void>}
 */
module.exports.newUser = async (params) => {
    const user = new Users(
        {
            userId: params.userId,
            username: params.username,
            firstname: params.firstname,
            lastname: params.lastname
        }
    );

    try {
        await user.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}

/**
 * Задает первоначальные параметры при создании пользователя из middleWare
 * @param params
 * @returns {Promise<*>}
 */
module.exports.setUserInfo = async (params) => {
    try {
        const result = await Users.updateOne({userId: params.userId},
            {
                username: params.username,
                firstname: params.firstname,
                lastname: params.lastname
            });
        return result.nModified;
    } catch (err) {
        throw new Error("Не могу изменить данные в базе");
    }
}

/**
 * Получает список всех админов
 * @returns {Promise<*>}
 */
module.exports.getAllAdmin = async () => {
    const admins = await Users.find({status: "admin"},
    {
        username: 1,
        _id: 0,
        firstname: 1,
        lastname: 1
    });
    return admins;
}

/**
 * Изменяет поля у пользователей по запросу админа
 * @param userId
 * @param property
 * @returns {Promise<*>}
 */
module.exports.changeUserCharacteristics = async (userId, property) => {
    try{
        const result = await Users.updateOne({userId: userId}, property);
        return  result.nModified;
    }catch (err) {
        throw new Error(err.message + ' БД балует');
    }
}

/**
 * требуется чтобы один раз заполнить базу
 * @param userId
 * @param data
 * @returns {Promise<void>}
 */
/*
module.exports.refactor = async (userId, data) => {
    const user = new Users(
        {
            userId: userId,
        }
    );

    try {
        await user.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}
*/
