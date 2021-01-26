const mongoose = require('mongoose');

/**
 *
 * messageType- message, document or callback_query
 */
const logsSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    username: {type: String},
    realname: {type: String},
    time: {type: Number, default: new Date()},
    messageType: {type: String},
    message: {type: String},
    note: {type: String, default: ""},
});

const Logs = mongoose.model('log', logsSchema);

module.exports.addLog = async (param) => {
    const record = new Logs(param)

    try{
        await record.save();
    }catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}