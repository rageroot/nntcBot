const mongoose = require('mongoose');

const mySelfSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    affairs: {type: Array}
}, {collection: 'mySelf'});

const Affair = mongoose.Model('mySelf', mySelfSchema);

/**
 * Создает новый документ в коллекции или редактирует существующий
 * @param userId
 * @param Новое дело
 * @returns {Promise<void>}
 */
module.exports.addAffair = async (userId, data) => {
    let userAffairs = Affair.findOne({userId: userId});
    if(!userAffairs){
        userAffairs = new Affair(
            {userId: userId}
        );
    }
    userAffairs.affairs.push({
        affair: data,
        date: Date.now()
    });
    try {
        await userAffairs.save();
    } catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}

