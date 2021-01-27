module.exports.textConstants = {
    DELETE: "Воу, дружочек, у тебя серьезные намерения.\n Если хочешь забыть все, что было- напиши:\n " +
        "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!",
    CONFIRM_DELETE: "Торжественно клянусь, что хочу стать бездельником и забыть все былые поступки! Раминь!",
    ACCESS_DENIED_MESSAGE: "",
    REPORTS_GENERATE_MANUAL_FILE: "resources/manual.txt",
    REPORTS_GENERATE_TEMPLATE_TXT: "odt_templates/reportsGenerator/reportTemplate.txt",
};

const keyboardConstants = {
    BELLS: "Расписание звонков",
    JITSY: "Статус онлайн конференций",
    VC: "Открыть ВЦ",
    MYSELF: "Листы самооценки",
    MYSELF_LIST: "Список выполненных дел",
    MYSELF_NEW: "Добавить новое дело",
    MYSELF_CLEAR: "Очистить список дел",
    MYSELF_GET_FILE: "Выгрузить файлом",
    REPORTS: "Генератор отчетов",
    REPORTS_MAN: "Инструкция",
    REPORTS_TEMPLATE: "Шаблон для заполнения",
    REPORTS_GENERATE: "Сгенерировать отчет"
}

module.exports.commands = {
    MYSELF_LIST: "myselfList",
    MYSELF_NEW: "myselfNew",
    MYSELF_CLEAR: "myselfClear",
    MYSELF_GET_FILE: "myselfFile",
    MYSELF_QUICK_NEW: "Д:",
    REPORTS_MAN: "reportsMan",
    REPORTS_TEMPLATE: "reportsTemplate",
    REPORTS_GENERATE: "reportsGenerate"
}

module.exports.welcomeMessage = {
    forStudents: 'Ты можешь смотреть расписание звонков \nи открывать дверь ВЦ, если тебе лично разрешит\nодин' +
        ' из админов.\nСписок админов можно получить по команде /admins\n' +
        ' чтобы повысить уровень привилегий- проси админа\nПолучить свой id /getId',
    forTeachers: "",
    forAdmins: "'Чтобы быстро добавить дело введи:',\n" +
        "        'Д: %whatYourDo%',\n" +
        "        'Чтобы включить или выключить отображение дат в листе самооценки: /showDate',\n" +
        "        'Или выбери действие:",
}

module.exports.mainKeyboard = {
    forStudents: {
        "reply_markup": {
            "keyboard": [
                [
                    keyboardConstants.BELLS,
                    keyboardConstants.VC,
                ]
            ]
        }
    },
    forAdmins: {
        "reply_markup": {
            "keyboard": [
                [
                    keyboardConstants.BELLS,
                    keyboardConstants.JITSY
                ],
                [
                    keyboardConstants.VC,
                    keyboardConstants.MYSELF,
                    keyboardConstants.REPORTS
                ]
            ]
        }
    }
}


module.exports.listsOfRights = {
    students: [keyboardConstants.BELLS, keyboardConstants.VC, '/start', '/help', '/admins', '/getId'],
    teachers: [],
}

module.exports.keyboardConstants = keyboardConstants;