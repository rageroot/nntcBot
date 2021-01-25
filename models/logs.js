const mongoose = require('mongoose');

const logsSchema = mongoose.Schema({
    userId: {type: Number, min: 1},
    username: {type: String},
    time: {type: Date, default: Date.now()},
    messageType: {type: String},
    message: {type: String}
});

const Logs = mongoose.model('log', logsSchema);

module.exports.addLog = async (param) => {
/*    const record = new Logs({
        userId: param.userId,
        username: param.username,
        messageType: param.messageType,
        message: param.message,
    });*/
    const record = new Logs(...param)

    try{
        await record.save();
    }catch (err) {
        throw new Error('Ошибка при сохранении в базу данных');
    }
}