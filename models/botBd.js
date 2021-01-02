const mongoose = require("mongoose");

module.exports.connect = () => {
        mongoose.connect('mongodb://localhost:27017/nntcBot', {useNewUrlParser: true}, (err) => {
            if(err) throw new Error('Нед подключения к базе');
        });

}


