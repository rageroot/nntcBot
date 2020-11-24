const Telegraf = require('telegraf');

const HttpsProxyAgent = require('https-proxy-agent');

const cfg = require('./helpers/config');
const otkrivator = require('./helpers/otkrivator');
const jitsi = require('./helpers/jitsi');
const bells = require('./helpers/bells');
const myself = require('./helpers/myself');
const easterEggs = require('./helpers/easterEggs');
const kursGen = require('./helpers/wizard-kurs-report-generator');
const menu = require('./helpers/menu');

/*const bot = new Telegraf(cfg.TG_TOKEN, {
    telegram: {
        agent: new HttpsProxyAgent('http://svg:svgpassw0rd@vslugin.ru:3128')
    }
});*/

const bot = new Telegraf(cfg.TG_TOKEN);

// ######## Middleware ###########

bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms  = new Date() - start;
    ctx.reply(`Запрос выполнен за ${ms} мс`);
});

// ######## Middleware ###########




const action = async (userId, userName, action) => {
    const ACCESS_DENIED_MESSAGE = userName + ', Вам доступ запрещён. Сообщите ваш ID для добавления полномочий: ' + userId;
    const WELCOME_MESSAGE = [
        'Добро пожаловать, ' + userName,
        'Действия:',
        'Расписание звонков: /bells',
        'Статус Jitsi: /jh',
        'Открыть ВЦ: /open_vc',
        'Открыть мастерские: /open_m',
  //      'Самооценка: /myself',
    ].join('\n');

    const MYSELF_MENU_L1 = [
        'Самооценка:',
        'Просмотр: /myselfList',
        'Добавить: /myselfNew',
    ].join('\n');

    const ACTION = (action) ? action : '*';
    // check access
    if (cfg.VALID_USERS.indexOf(userId) === -1) {
        return ACCESS_DENIED_MESSAGE;
    }

    switch (action) {
        case 'start':
            return WELCOME_MESSAGE;
        case 'open_vc':
            return await otkrivator.openItPark();
        case 'bells':
            return await bells.info();
        case 'jh':
            return userName + ', ' + await jitsi.health();
        case 'open_m':
            return await otkrivator.openMasterskie();
        case 'myself':
            return MYSELF_MENU_L1;
//        case 'myselfList':
//            return myself.list(userId, userName);
//        case 'myselfNew':
//            return myself.new(userId, userName);
//        case 'voice':
//            return easterEggs.getEgg(userId, userName, 'voice');
        case '*':
            return 'test';
    }

};

bot.start(async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'start'));
});

//bot.hears('голос!', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

//bot.command('voice', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

bot.command('open_vc', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'open_vc'));
});

bot.command('bells', async (ctx) => {
    ctx.replyWithHTML(await action(ctx.from.id.toString(), ctx.from.first_name, 'bells'));
});

bot.command('jh', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'jh'));
});

bot.command('open_m', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'open_m'));
});

//bot.command('myself', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'myself'));
//});

//bot.command('myselfList', async (ctx) => {
//    ctx.replyWithMarkdown(await action(ctx.from.id.toString(), ctx.from.first_name, 'myselfList'));
//});

//bot.command('myselfNew', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'myselfNew'));
//});


// dfl
// bot.start((ctx) => ctx.reply('Welcome'));
// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on('sticker', (ctx) => ctx.reply('👍'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));
// bot.hears('Ебот?', (ctx) => ctx.reply('Да, я тут. Твои возможности: /new'));
// bot.hears('/new', (ctx) => ctx.reply('Ага'));

// kursGen.init(bot);

bot.launch();
