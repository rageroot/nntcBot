const {Telegraf} = require('telegraf');
const {Markup} = require('telegraf');


//const HttpsProxyAgent = require('https-proxy-agent');

const cfg = require('./resources/config');
const strings = require('./resources/strings');
const otkrivator = require('./helpers/otkrivator');
const jitsi = require('./helpers/jitsi');
const bells = require('./helpers/bells');
const myself = require('./helpers/myself');
const report = require('./helpers/report-generator');
const bd = require('./models/botBd');
const userModel = require('./models/users');

// const easterEggs = require('./helpers/easterEggs');
// const kursGen = require('./helpers/wizard-kurs-report-generator');


const bot = new Telegraf(cfg.TG_TOKEN);
bd.connect();
/**
 * intention- буфер намерений пользователя выполнить ввод данных следующим действием
 * Защита от сучайного срабатывания
 *
 * addCase - буфер, помогающий определить цель следующего сообщения- обработать как текст или записать в список дел
 * Считаем, что пользователь может передумать вводить новое дело и забьет другую команду, в таком случае
 * middlewares пометит свойство объекта == id пользователя на удаление и удалит при следующем вводе.
 *
 * addTemplateToGenerateReport - намерение загрузить заполненный шаблон для генерации отчетов по практике. Тот же принцип
 * @type {{}}
 */
const intention = {
    addCase: {},
    addTemplateToGenerateReport: {}
};

let userId;
let userName;

// ######## Middleware ###########
/**
 * установка значений id и имени пользователя
 */
bot.use(async (ctx, next) => {
    userId = ctx.from.id.toString();
    userName = ctx.from.first_name;
    await next();
});

/**
 * отсекаю невалидных пользователей
 * Отключил на кое какое время ;-)
 */
/*bot.use(async (ctx, next) => {
    strings.textConstants.ACCESS_DENIED_MESSAGE = userName + ', Вам доступ запрещён. Сообщите ваш ID для добавления полномочий: ' + userId;

    if (cfg.VALID_USERS.indexOf(userId) === -1) {
        await ctx.reply(strings.textConstants.ACCESS_DENIED_MESSAGE);
    }
    else {
        await next();
    }
});*/

/**
 * Каждый раз проверка, что пользователь есть в базе данных
 */
bot.use(async (ctx,next) => {
    const user = await userModel.get(userId);
    if(!user){
        await userModel.newUser(userId);
    }
    await next();
});


/**
 * скорость выполнения запросов. По умолчанию не используется
 */
bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms  = new Date() - start;
 //await  ctx.reply(`Запрос выполнен за ${ms} мс`);
});

/**
 * Защита от случайного срабатываия записи дел и генерации отчетов.
 * Если сразу после предложения ввести новое дело или загрузить шаблон пользователь выбрал другое действие на клавиатуре
 * или команду- ввод намерение отменяется. Реализовано при помощи добавления свойств в глобальный объект
 */
bot.use(async (ctx, next) => {
    const userId = ctx.from.id.toString();
    if(userId in intention.addCase){
        if(intention.addCase[userId] === true){
           delete intention.addCase[userId];
        }
        else{
            intention.addCase[userId] = true;
        }
    }
    if(userId in intention.addTemplateToGenerateReport){
        if(intention.addTemplateToGenerateReport[userId] === true){
            delete intention.addTemplateToGenerateReport[userId];
        }
        else{
            intention.addTemplateToGenerateReport[userId] = true;
        }
    }
    await next();
});

//bot.use(Telegraf.log());

// ######## Middleware ###########


/**
 * выводит приветсвенное сообщение и основную клавиатуру
 * @param ctx
 * @returns {Promise<void>}
 */
async function hello(ctx){
    const WELCOME_MESSAGE = [
        'Добро пожаловать, ' + userName,
        'Чтобы быстро добавить дело введи:',
        'Д: %whatYourDo%',
        'Чтобы включить или выключить отображение дат в листе самооценки: /showDate',
        'Или выбери действие:',
    ].join('\n');

    await ctx.reply(WELCOME_MESSAGE, {
        "reply_markup": {
            "keyboard": [
                            [
                                strings.keyboardConstants.BELLS,
                                strings.keyboardConstants.JITSY
                            ],
                            [
                                strings.keyboardConstants.VC,
                                strings.keyboardConstants.MYSELF,
                                strings.keyboardConstants.REPORTS
                            ]
                        ]
        }
    });
}

/**
 * Выводит меню самооценки
 * @param ctx
 * @returns {Promise<void>}
 */
async function mySelfMenu(ctx){
    await ctx.reply('Меню самооценки:',
         Markup.inlineKeyboard(
             [[ Markup.callbackButton(strings.keyboardConstants.MYSELF_LIST, strings.commands.MYSELF_LIST)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_NEW, strings.commands.MYSELF_NEW)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_CLEAR, strings.commands.MYSELF_CLEAR)],
             [Markup.callbackButton(strings.keyboardConstants.MYSELF_GET_FILE, strings.commands.MYSELF_GET_FILE)],
             ]).extra());
}

/**
 * Выводит меню генерации отчета по практикам
 * @param ctx
 * @returns {Promise<void>}
 */
async function reportMenu(ctx){
    await ctx.reply('Меню генерации отчетов по практике:',
        Markup.inlineKeyboard(
            [[ Markup.callbackButton(strings.keyboardConstants.REPORTS_MAN, strings.commands.REPORTS_MAN)],
                [Markup.callbackButton(strings.keyboardConstants.REPORTS_TEMPLATE, strings.commands.REPORTS_TEMPLATE)],
                [Markup.callbackButton(strings.keyboardConstants.REPORTS_GENERATE, strings.commands.REPORTS_GENERATE)],
            ]).extra());
}

bot.start(async (ctx) => {
    await hello(ctx);
});

bot.help( async (ctx) => {
    await hello(ctx);
});

//bot.command('voice', async (ctx) => {
//    ctx.reply(await action(ctx.from.id.toString(), ctx.from.first_name, 'voice'));
//});

/**
 * Команда на открытие двери ВЦ
 */
bot.hears(strings.keyboardConstants.VC, async (ctx) => {
    await ctx.reply(await otkrivator.openItPark());
});

/**
 * Команда на получение информации о расписании звонков
 */
bot.hears(strings.keyboardConstants.BELLS, async (ctx) => {
    await ctx.replyWithHTML(await bells.info());
});

/**
 * Команда на статус Jitsi
 */
bot.hears(strings.keyboardConstants.JITSY, async (ctx) => {
    await ctx.reply(userName + ', ' + await jitsi.health());
});

/**
 * заглушка на команду на открытие мастерских
 */
bot.command('open_m', async (ctx) => {
    await ctx.reply(await otkrivator.openMasterskie());
});

//Когда то код был нужен для рефакторинга хранимых данных. Возможно, еще понадобиться
//
/*bot.command('ref', async (ctx) => {
    await ctx.reply(await myself.refactor(cfg.VALID_USERS));
});*/

/**
 * Включает и выключает режим вывода дат в листах самооценки
 */
bot.command('showDate', async (ctx) => {
    try {
        const show = await userModel.get(userId);
        const queryRes = await userModel.dateDisplay(userId, !show.showDate);
        if(queryRes) {
            await ctx.reply(`Вывод дат в листах самооценки ${(!show.showDate) ? 'включен' : 'выключен'}`);
        }else{
            await ctx.reply("Твоих данных нет в базе, дружочек");
        }
    } catch (err) {
        await ctx.reply(err.message);
    }
});

/**
 * Команда на вывод меню самооценки
 */
bot.hears(strings.keyboardConstants.MYSELF, async (ctx) => {
    await mySelfMenu(ctx);
});

/**
 * Команда на вывод меню генерации отчетов
 */
bot.hears(strings.keyboardConstants.REPORTS, async (ctx) => {
    await reportMenu(ctx);
})

/**
 * Если пользователь загрузил файл- проверяю намерение сгенерировать отчет
 */
bot.on('document', async (ctx) => {
    // await ctx.reply(ctx.message.document.file_id);
    try {
         if (userId in intention.addTemplateToGenerateReport) {
            delete intention.addTemplateToGenerateReport[userId];
            const fileId = ctx.message.document.file_id;
            //не хотел подключать API телеграмма к хэлперам, по этому подготавливаю
            //файл к загрузке в роутере
            const telegramFileResponse = await ctx.telegram.getFile(fileId);
            const pathToArchiveWithReports = await report.generate(userId, telegramFileResponse);
            await ctx.replyWithDocument({source: pathToArchiveWithReports});
         }
    }catch (err) {
        await ctx.reply(err.message);
    }finally {
        await report.garbageCollector(userId);
    }
});

/**
 * Выполняется если бот получил произвольный текст.
 * Проверка не было ли предложения ввести дело,
 * Проверка не было ли быстрой команды на ввод дела
 * Проверка на очистку листа сомооценки
 */
bot.on('text', async (ctx) => {
    try {
        if (userId in intention.addCase) {     //Если бот предложил пользователю ввести дело, то в объекте будет свойство == id
            delete intention.addCase[userId];
            await ctx.reply(await myself.new(userId, userName, ctx.message.text.trim()));
        } else {
            if (ctx.message.text.startsWith(strings.commands.MYSELF_QUICK_NEW)) {
                await ctx.reply(await myself.new(userId, userName, ctx.message.text.slice(2).trim()));
            } else {
                if (ctx.message.text === strings.textConstants.CONFIRM_DELETE) {
                    await ctx.reply(await myself.clear(userId));
                } else {
                    await hello(ctx);
                }
            }
        }
    }catch (err) {
        await ctx.reply(err.message);
    }
});

//обработка команд с inline клавиатуры

/**
 * Роутер нажатия кнопок inline клавиатуры
 */
bot.on('callback_query', async (ctx) =>{
        const callbackQuery = ctx.callbackQuery.data;
        await mySelfMenuCallback(ctx, callbackQuery);
        await reportMenuCallback(ctx, callbackQuery);
});

/**
 * Реакция на нажатие кнопок меню генерации отчетов
 * @param ctx
 * @param callbackQuery
 * @returns {Promise<void>}
 */
async function reportMenuCallback(ctx, callbackQuery){
    try {
        switch (callbackQuery) {
            case strings.commands.REPORTS_MAN:
                await ctx.replyWithDocument({source: report.manual()});
                break;
            case strings.commands.REPORTS_TEMPLATE:
                await ctx.replyWithDocument({source: report.template()});
                break;
            case strings.commands.REPORTS_GENERATE:
                intention.addTemplateToGenerateReport[userId] = false;
                await ctx.reply("Дай мне заполненный шаблон, дружочек");
                break;
        }
    }catch (err) {
        await ctx.reply(err.message);
    }
}

/**
 * Реакция на нажатие кнопок меню самооценки
 * @param ctx
 * @param callbackQuery
 * @returns {Promise<void>}
 */
async function mySelfMenuCallback(ctx, callbackQuery){
    try {
        switch (callbackQuery) {
            case strings.commands.MYSELF_LIST:
                await ctx.reply(await myself.list(userId, userName));
                break;
            case strings.commands.MYSELF_NEW:
                intention.addCase[userId] = false;
                await ctx.reply("Что ты сделал, дружочек?");
                break;
            case strings.commands.MYSELF_CLEAR:
                await ctx.reply(strings.textConstants.DELETE);
                break;
            case strings.commands.MYSELF_GET_FILE:
                await replyMyselfFile(userId, ctx);
                break;
        }
    }catch (err) {
        await ctx.reply(err.message);
    }
}

/**
 * Отдает в чат лист самооценки и прибирает мусор за генератором файла
 * @param userId
 * @param ctx
 * @returns {Promise<unknown>}
 */
async function replyMyselfFile(userId, ctx){
    return new Promise(async (resolve, reject) => {
        try {
            const myselfFile = await myself.getMyselfFile(userId);
            await ctx.replyWithDocument({source: myselfFile});
            resolve();
        }
        catch (err) {
            reject(new Error(err.message));
        }
        finally {
            await myself.garbageCollector(userId); //сборка мусора
        }
    });
}

bot.launch();

/**
 * Перехват необработанных ошибок
 */
process.on("uncaughtException",(err) => {
    console.log("Все паламалась!!!");
    console.log(err.message);
});
