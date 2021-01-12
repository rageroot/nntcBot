const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    showDate: {type: Boolean, default: false}
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
 * @param userId
 * @returns {Promise<void>}
 */
module.exports.newUser = async (userId) => {
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
