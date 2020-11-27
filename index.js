const {Telegraf} = require('telegraf');
const {Markup} = require('telegraf');


//const HttpsProxyAgent = require('https-proxy-agent');

const cfg = require('./helpers/config');
const otkrivator = require('./helpers/otkrivator');
const jitsi = require('./helpers/jitsi');
const bells = require('./helpers/bells');
const myself = require('./helpers/myself');
const easterEggs = require('./helpers/easterEggs');
const kursGen = require('./helpers/wizard-kurs-report-generator');


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

const DELETE = "Воу, дружочек, у тебя серьезные намерения.\n Если хочешь забыть все, что было- напиши:\n " +
    "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!";
const CONFIRM_DELETE = "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!";

let userId;
let userName;
// ######## Middleware ###########
bot.use(async (ctx, next) => { //установка значений id и имени пользователя
    userId = ctx.from.id.toString();
    userName = ctx.from.first_name;
    await next();
});

bot.use(async (ctx, next) => { //скорость выполнения запросов
    const start = new Date();
    await next();
    const ms  = new Date() - start;
 //  ctx.reply(`Запрос выполнен за ${ms} мс`);
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

//bot.use(Telegraf.log());

// ######## Middleware ###########

const action = async (action) => {
    const ACCESS_DENIED_MESSAGE = userName + ', Вам доступ запрещён. Сообщите ваш ID для добавления полномочий: ' + userId;

    const MYSELF_MENU_L1 = [
        'Самооценка:',
        'Просмотр: /myselfList',
        'Добавить: /myselfNew',
        'Очистить: /myselfClear'
    ].join('\n');

    const HELP_MESSAGE = [
        'Для начала работы введите команду /start',
        'Чтобы быстро добавить дело введи:',
        'Д: %whatYourDo%'
    ].join('\n');

    const ACTION = (action) ? action : '*';
    // check access
    if (cfg.VALID_USERS.indexOf(userId) === -1) {
        return ACCESS_DENIED_MESSAGE;
    }

    switch (action) {
      /*  case 'start':
            return WELCOME_MESSAGE;*/
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
       /* case 'help':
            return HELP_MESSAGE;*/
    }

};

async function hello(ctx){
    const WELCOME_MESSAGE = [
        'Добро пожаловать, ' + userName,
        'Чтобы быстро добавить дело введи:',
        'Д: %whatYourDo%',
        'Или выбери действие:',
    ].join('\n');

    await ctx.telegram.sendMessage(ctx.chat.id, WELCOME_MESSAGE, {
        "reply_markup": {
            "keyboard": [["Расписание звонков", "Статут Jitsi"],   ["Открыть ВЦ", "Листы самооценки"]]
        }
    });
}

bot.start(async (ctx) => {
    await hello(ctx);
    //await ctx.reply(await action('start'));
});

bot.help( async (ctx) => {
    await hello(ctx);
     //console.log(Markup);
     /*await ctx.telegram.sendMessage(ctx.chat.id,'Help keyboard',
         Markup.inlineKeyboard([ Markup.callbackButton('/start', '/bells')]).extra());*/
    //await ctx.reply(await action('help'));

});
//bot.hears('голос!', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

//bot.command('voice', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

bot.hears('Открыть ВЦ', async (ctx) => {
    await ctx.reply(await action('open_vc'));
});

bot.hears('Расписание звонков', async (ctx) => {
    await ctx.replyWithHTML(await action( 'bells'));
});

bot.hears('Статут Jitsi', async (ctx) => {
    await ctx.reply(await action( 'jh'));
});

bot.command('open_m', async (ctx) => {
    await ctx.reply(await action('open_m'));
});

bot.hears('Листы самооценки', async (ctx) => {
    await ctx.reply(await action( 'myself'));
});

bot.command('myselfList', async (ctx) => {
    await ctx.reply(await action('myselfList'));
});

bot.command('myselfNew', async (ctx) => {
    await ctx.reply(await action('myselfNew'));
});

bot.command('myselfClear',  async (ctx) => {
    await ctx.reply(DELETE);
});

//если в сообщении будет подходящий шаблон, то выполняем соотвествующие действия
bot.on('text', async (ctx) => {
    if(userId in addCase) {     //Если бот предложил пользователю ввести дело, то в объекте будет свойство == id
        delete addCase[userId];
        await ctx.reply(await myself.new(userId, userName, ctx.message.text.trim()));
    }
    else{
        if (ctx.message.text.startsWith('Д:')) {
            await ctx.reply(await myself.new(userId, userName, ctx.message.text.slice(5).trim()));
        } else {
            if (ctx.message.text === CONFIRM_DELETE) {
                await ctx.reply(await action('myselfClear'));
            } else {
                await hello(ctx);
            }
        }
    }
});

bot.on('callback_query', async (ctx) =>{
    const callbackQuery =  ctx.callbackQuery.data;
    await ctx.replyWithHTML(await action( 'bells'));
});
bot.launch();
