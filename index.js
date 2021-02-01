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
const logs = require('./models/logs');
const rights = require('./helpers/cowSuperPowers');

// const easterEggs = require('./helpers/easterEggs');
// const kursGen = require('./helpers/wizard-kurs-report-generator');


const bot = new Telegraf(cfg.TG_TOKEN);
bd.connect();
/**
 * intention- буфер намерений пользователя выполнить ввод данных следующим действием.
 * Хранит информацию о пользователе, изменения в которого хочет вносить админ
 * Защита от сучайного срабатывания
 *
 * addCase - буфер, помогающий определить цель следующего сообщения- обработать как текст или записать в список дел
 * Считаем, что пользователь может передумать вводить новое дело и забьет другую команду, в таком случае
 * middlewares пометит свойство объекта == id пользователя на удаление и удалит при следующем вводе.
 *
 * addTemplateToGenerateReport - намерение загрузить заполненный шаблон для генерации отчетов по практике. Тот же принцип
 *
 * rights - объект, хранящий свойства вида
 *          idАдминистратора: userChoiseId- idПользователя, с которым админ ведет работу
 *          idАдминистратора: userChoise,
 *                  true(Команда пришла),
 *                  false(Ожидает текст),
 *                  null(Сброс намерения) есть ли намерение у админа
 *              выбрать пользователя для работы
 * @type {{}}
 */
const intention = {
    addCase: {},
    addTemplateToGenerateReport: {},
    rights: {}
};

// ######## Middleware ###########
/**
 * установка значений id, имени пользователя
 */
bot.use(async (ctx, next) => {
    ctx.userId = ctx.from.id.toString()
    ctx.userName = ctx.from.first_name
    await next();
});

/**
 * Каждый раз проверка, что пользователь есть в базе данных
 * и устанавливает в обхект ctx дополнительные сведения о пользователе.
 * Докидывает пользователя в базу, если его нет.
 */
bot.use(async (ctx,next) => {
    const user = await userModel.get(ctx.userId);
    if(!user){
        await userModel.newUser(
            {
                userId: ctx.userId,
                username: ctx.from.username,
                firstname: ctx.from.first_name,
                lastname: ctx.from.last_name
            });
        ctx.status = "student";
        ctx.opener = "false";
    }else{
        ctx.status = user.status;
        ctx.note = user.note;
        ctx.opener = (user.status === 'student') ? user.opener : true;

        if(user.username === "null"){
            await userModel.setUserInfo(
                {
                    userId: ctx.userId,
                    username: ctx.from.username,
                    firstname: ctx.from.first_name,
                    lastname: ctx.from.last_name
                });
        }
    }
    await next();
});

/**
 * Логирование запросов
 */
bot.use(async (ctx, next) => {
    const recordForLog = {
        userId: ctx.userId,
        username: ctx.from.username,
        realname: ctx.from.first_name + " " + ctx.from.last_name,
        note: ctx.note,
    };
    switch (ctx.updateType){
        case "message":
            if(ctx.updateSubTypes[0] === 'document'){
                recordForLog.messageType = 'document';
                recordForLog.message = 'document';
            }else{
                recordForLog.messageType = 'message';
                recordForLog.message = ctx.message.text;
            }
            break;
        case "callback_query":
            recordForLog.messageType = 'callback_query';
            recordForLog.message = ctx.update.callback_query.data;
            break;
        default: break;
    }
    ctx.messageType = recordForLog.messageType;
    ctx.request = recordForLog.message;
    await logs.addLog(recordForLog);
    await next();
});

/**
 * отсекаю пользователям действия, на которые у них нет прав
 */
bot.use(async (ctx, next) => {
    if(await rights.hasAccess(ctx.status, ctx.messageType, ctx.request, ctx.opener)){
        await next();
    }else{
        await ctx.reply("Нет доступа");
    }

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
 * Защита от случайного срабатываия записи дел, генерации отчетов и управленяи пользователями.
 * Если сразу после предложения ввести новое дело,
 * загрузить шаблон,
 * или выполнить ввод в меню редактирования пользователя
 * пользователь выбрал другое действие на клавиатуре
 * или команду- ввод намерение отменяется.
 * Реализовано при помощи добавления свойств в глобальный объект
 *
 * Создает поля в объекте intention.rights, если необходимых для работы нет
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

    if(userId in intention.rights){
        if(intention.rights[userId].userChoise !== null) {
            if (intention.rights[userId].userChoise === true) {
                intention.rights[userId].userChoise = false;
            } else if (intention.rights[userId].userChoise === false) {
                intention.rights[userId].userChoise = null;
            }
        }
    }else{
        intention.rights[userId] = {
            userChoise: null,
            userChoiseId: null
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
    let welcomeMessage = 'Добро пожаловать, ' + ctx.userName + '\n';
    let mainKeyboard;

    switch (ctx.status) {
        case 'student':
            welcomeMessage += strings.welcomeMessage.forStudents;
            mainKeyboard = strings.mainKeyboard.forStudents;
            break;
        case 'admin':
            welcomeMessage += strings.welcomeMessage.forAdmins;
            mainKeyboard = strings.mainKeyboard.forAdmins;
    }

    await ctx.reply(welcomeMessage, mainKeyboard);
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

/*const intention = {
    addCase: {},
    addTemplateToGenerateReport: {}
    rights: {}
};*/

/**
 * Выводит меню генерации пользователей.
 * Админ может выбрать пользоватлея для работы, в таком случае, начинает выводиться информация о пользователе
 * id пользователя, который в работе, храниться в глобальном объекте intention.rights
 * @param ctx
 * @returns {Promise<void>}
 */
async function rightsMenu(ctx){
    const message = ['Меню управления пользователями: '];
    const keyboard = [[ Markup.callbackButton(strings.keyboardConstants.RIGHTS_USER_CHOISE, strings.commands.RIGHTS_USER_CHOISE)]];
   //intention.rights[ctx.userId] = 80422700000000;
    if((ctx.userId in intention.rights) && intention.rights[ctx.userId].userChoiseId !== null && intention.rights[ctx.userId].userChoiseId !== undefined){
        message.push(await rights.getUserInfo(intention.rights[ctx.userId].userChoiseId));
        if(message[1].startsWith('Выбран пользователь')){
            keyboard.push([Markup.callbackButton(strings.keyboardConstants.RIGHTS_USER_SET_STATUS, strings.commands.RIGHTS_USER_SET_STATUS)],
                [Markup.callbackButton(strings.keyboardConstants.RIGHTS_USER_SET_OPENER, strings.commands.RIGHTS_USER_SET_OPENER)],
                [Markup.callbackButton(strings.keyboardConstants.RIGHTS_USER_SET_NOTE, strings.commands.RIGHTS_USER_SET_NOTE)],
                [Markup.callbackButton(strings.keyboardConstants.RIGHTS_USER_CLEAR, strings.commands.RIGHTS_USER_CLEAR)]);
        }else{
            intention.rights[ctx.userId] = null;
        }
    }else{
        message.push('Не выбран пользователь для изменения прав доступа');
    }
    await ctx.reply(message.join('\n'), Markup.inlineKeyboard(
        keyboard).extra());
}

bot.start(async (ctx) => {
    await hello(ctx);
});

bot.help( async (ctx) => {
    await hello(ctx);
});

/**
 * Выводит telegramId пользователя
 */
bot.command('getId', async (ctx) => {
    await ctx.reply(ctx.userId);
});

/**
 * Выводит список всех админов
 */
bot.command('admins', async (ctx) => {
    await ctx.reply(await rights.getAdmins());
});

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
    await ctx.reply(ctx.userName + ', ' + await jitsi.health());
});

/**
 * заглушка на команду на открытие мастерских
bot.command('open_m', async (ctx) => {
    await ctx.reply(await otkrivator.openMasterskie());
});*/

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
        const show = await userModel.get(ctx.userId);
        const queryRes = await userModel.dateDisplay(ctx.userId, !show.showDate);
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
 * Команда на вывод меню управления правами пользователей
 */
bot.hears(strings.keyboardConstants.RIGHTS, async (ctx) => {
    await rightsMenu(ctx);
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
         if (ctx.userId in intention.addTemplateToGenerateReport) {
            delete intention.addTemplateToGenerateReport[ctx.userId];
            const fileId = ctx.message.document.file_id;
            //не хотел подключать API телеграмма к хэлперам, по этому подготавливаю
            //файл к загрузке в роутере
            const telegramFileResponse = await ctx.telegram.getFile(fileId);
            const pathToArchiveWithReports = await report.generate(ctx.userId, telegramFileResponse);
            await ctx.replyWithDocument({source: pathToArchiveWithReports});
         }
    }catch (err) {
        await ctx.reply(err.message);
    }finally {
        await report.garbageCollector(ctx.userId);
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
        if(intention.rights[ctx.userId].userChoise === false){
            intention.rights[ctx.userId].userChoiseId = ctx.message.text.trim();
            await ctx.reply("Пользователь выбран");
        }else {
            if (ctx.userId in intention.addCase) {     //Если бот предложил пользователю ввести дело, то в объекте будет свойство == id
                delete intention.addCase[ctx.userId];
                await ctx.reply(await myself.new(ctx.userId, ctx.userName, ctx.message.text.trim()));
            } else {
                if (ctx.message.text.startsWith(strings.commands.MYSELF_QUICK_NEW)) {
                    await ctx.reply(await myself.new(ctx.userId, ctx.userName, ctx.message.text.slice(2).trim()));
                } else {
                    if (ctx.message.text === strings.textConstants.CONFIRM_DELETE) {
                        await ctx.reply(await myself.clear(ctx.userId));
                    } else {
                        await hello(ctx);
                    }
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
        await rightsMenuCallback(ctx, callbackQuery);
});

/**
 * Реакция на нажатие кнопок в меню управления пользователем
 * @param ctx
 * @param callbackQuery
 * @returns {Promise<void>}
 */
async function rightsMenuCallback(ctx, callbackQuery){
    try{
        switch (callbackQuery) {
            case strings.commands.RIGHTS_USER_CHOISE:
                intention.rights[ctx.userId].userChoise = true;
                await ctx.reply("Введи id пользователя, дружочек");
                break;
        }
    }catch (err) {
        await ctx.reply(err.message);
    }
}

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
                intention.addTemplateToGenerateReport[ctx.userId] = false;
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
                await ctx.reply(await myself.list(ctx.userId, ctx.userName));
                break;
            case strings.commands.MYSELF_NEW:
                intention.addCase[ctx.userId] = false;
                await ctx.reply("Что ты сделал, дружочек?");
                break;
            case strings.commands.MYSELF_CLEAR:
                await ctx.reply(strings.textConstants.DELETE);
                break;
            case strings.commands.MYSELF_GET_FILE:
                await replyMyselfFile(ctx.userId, ctx);
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
