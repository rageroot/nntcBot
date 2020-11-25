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
const addCase = {};
/*
* addCase - буфер, помогающий определить цель следующего сообщения- обработать как текст или записать в список дел
* Считаем, что пользователь может передумать вводить новое дело и забьет другую команду, в таком случае
* middlewares пометит свойство объекта == id пользователя на удаление и удалит при следующем вводе.
* Защита от сучайного срабатывания
* */
// ######## Middleware ###########

bot.use(async (ctx, next) => { //скорость выполнения запросов
    const start = new Date();
    await next();
    const ms  = new Date() - start;
   ctx.reply(`Запрос выполнен за ${ms} мс`);
});

bot.use(async (ctx, next) => {  //Защита от случайного срабатываия записи дел
    const userId = ctx.from.id.toString();
    if(userId in addCase){
        if(addCase[userId] == true){
           delete addCase[userId];
        }
        else{
            addCase[userId] = true;
        }
    }
    await next();
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
        'Самооценка: /myself',
    ].join('\n');

    const MYSELF_MENU_L1 = [
        'Самооценка:',
        'Просмотр: /myselfList',
        'Добавить: /myselfNew',
        'Очистить: /myselfClear'
    ].join('\n');

    const HELP_MESSAGE = [
        'Для начала работы введите команду /start',
        'Чтобы быстро добавить дело введи:',
        'Дело: %whatYourDo%'
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
        case 'myselfList':
            return await myself.list(userId, userName);
        case 'myselfNew':
            addCase[userId] = false;
            return 'Что ты сделал, дружочек?';
        case 'myselfClear':
            return await myself.clear(userId);
//        case 'voice':
//            return easterEggs.getEgg(userId, userName, 'voice');
        case 'help':
            return HELP_MESSAGE;
    }

};

bot.start(async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'start'));
});

bot.help(async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'help'));
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

bot.command('myself', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'myself'));
});

bot.command('myselfList', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'myselfList'));
});

bot.command('myselfNew', async (ctx) => {
    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'myselfNew'));
});

bot.command('myselfClear',  async (ctx) => {
    ctx.reply("Воу, дружочек, у тебя серьезные намерения.\n Если хочешь забыть все, что было- напиши:\n " +
        "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!");
});

//если в сообщении будет подходящий шаблон, то выполняем соотвествующие действия
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    if(userId in addCase) {
        delete addCase[userId];
        ctx.reply(await myself.new(userId, ctx.from.first_name, ctx.message.text.trim()));
    }
    else{
        if (ctx.message.text.startsWith('Дело:')) {
            ctx.reply(await myself.new(userId, ctx.from.first_name, ctx.message.text.slice(5).trim()));
        } else {
            if (ctx.message.text === "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!") {
                ctx.reply(await action(userId, ctx.from.first_name, 'myselfClear'));
            } else {
                ctx.reply('Приветствую, друг! Введи команду /start и мы начнем');
            }
        }
    }
});
//ctx.message.text
// dfl
// bot.start((ctx) => ctx.reply('Welcome'));
// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on('sticker', (ctx) => ctx.reply('👍'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));
// bot.hears('Ебот?', (ctx) => ctx.reply('Да, я тут. Твои возможности: /new'));
// bot.hears('/new', (ctx) => ctx.reply('Ага'));

// kursGen.init(bot);

bot.launch();
