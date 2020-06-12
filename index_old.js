let telegram = require('telegram-bot-api');
const ch = require('./helpers/config');
const oh = require('./helpers/otkrivator');
const menuHelper = require('./helpers/menu');

const apiConfig = {
    token: process.env.TGTOKEN,
    updates: {
        enabled: true,
        get_interval: 1000
    }
};

if (process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT && process.env.TG_PROXY_USER && process.env.TG_PROXY_PASSWORD) {
    apiConfig.http_proxy = {
        https: false,
        host: process.env.TG_PROXY_HOST,
        port: parseInt(process.env.TG_PROXY_PORT),
        user: process.env.TG_PROXY_USER,
        password: process.env.TG_PROXY_PASSWORD
    }
}

let api = new telegram(apiConfig);

//When user click on button, 'CallbackQuery' Object will be catch by code below
api.on('inline.callback.query', function (msg) {

    const chatId = msg.message.chat.id;
    const fromId = msg.from.id.toString();

    if(ch.VALID_USERS.indexOf(fromId) === -1){
        ch.answ(api, chatId, 'Ваш доступ запрещён. Сообщите ваш ID ('+fromId+') для добавления полномочий');
        return;
    }

    const data = msg.data; //Value from 'callback_data' field of clicked button
    switch (data) {
        case 'open-itpark':
            oh.openItPark().then(html => {
                ch.answ(api, chatId, 'Успешно!');
            }).catch(err => {
                ch.answ(api, chatId, 'Не удалось');
            });
            break;
        case 'open-m':
            oh.openMasterskie().then(html => {
                ch.answ(api, chatId, 'Успешно!');
            }).catch(err => {
                ch.answ(api, chatId, 'Не удалось');
            });
            break;
        case 'cluster-1c':
            menuHelper.cluster1C(api, chatId);
            break;
        default:
            ch.answ(api, chatId, 'Пока не реализовано');
    }
});

api.on('message', function (message) {

    var chatId = message.chat.id;
    const fromId = message.from.id.toString();

    if(ch.VALID_USERS.indexOf(fromId) === -1){
        ch.answ(api, chatId, 'Доступ запрещён. Ваш ID: '+fromId);
        return;
    }

    menuHelper.main(api, chatId)
        .then( msg => {
            // console.log(msg); })
        })
        .catch( err => {
           // console.log(err);
        });


});
