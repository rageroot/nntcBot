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
    MYSELF: "Самооценка",
    RIGHTS: "Управление пользователями",
    MYSELF_LIST: "Список выполненных дел",
    MYSELF_NEW: "Добавить новое дело",
    MYSELF_CLEAR: "Очистить список дел",
    MYSELF_GET_FILE: "Выгрузить файлом",
    REPORTS: "Генератор отчетов",
    REPORTS_MAN: "Инструкция",
    REPORTS_TEMPLATE: "Шаблон для заполнения",
    REPORTS_GENERATE: "Сгенерировать отчет",
    RIGHTS_USER_CHOISE: "Выбрать пользователя",
    RIGHTS_USER_SET_OPENER: "Изменить право открытия двери",
    RIGHTS_USER_SET_STATUS: "Изменить статус пользователя",
    RIGHTS_USER_SET_NOTE: "Оставить заметку",
    RIGHTS_USER_CLEAR: "Отменить выбор",
}

module.exports.commands = {
    MYSELF_LIST: "myselfList",
    MYSELF_NEW: "myselfNew",
    MYSELF_CLEAR: "myselfClear",
    MYSELF_GET_FILE: "myselfFile",
    MYSELF_QUICK_NEW: "Д:",
    REPORTS_MAN: "reportsMan",
    REPORTS_TEMPLATE: "reportsTemplate",
    REPORTS_GENERATE: "reportsGenerate",
    RIGHTS_USER_CHOISE: "userChoise",
    RIGHTS_USER_SET_OPENER: "userSetOpener",
    RIGHTS_USER_SET_STATUS: "userSetStatus",
    RIGHTS_USER_SET_NOTE: "userSetNote",
    RIGHTS_USER_CLEAR: "userChoiseClear",
}

module.exports.welcomeMessage = {
    forStudents: 'Твой уровень доступа- студент\n' +
        'Ты можешь смотреть расписание звонков \nи открывать дверь ВЦ, если тебе лично разрешит\nодин' +
        ' из админов.\nСписок админов можно получить по команде /admins\n' +
        ' чтобы повысить уровень привилегий- проси админа\nПолучить свой id /getId',
    forTeachers: "Твой уровень доступа- преподаватель\n" +
        'Ты можешь смотреть расписание звонков \nОткрывать дверь ВЦ, если тебе лично разрешит\nодин' +
        'из админов.\nСписок админов можно получить по команде /admins\n'+
        'чтобы повысить уровень привилегий- проси админа\nПолучить свой id /getId \n' +
        'Можешь получать список активных конференций\n' +
        'Можешь вести листы самооценки\n' +
        'Чтобы быстро добавить дело введи:\n' +
        'Д: %whatYourDo%\n' +
        'Чтобы включить или выключить отображение дат в листе самооценки: /showDate,\n' +
        'Можешь генерировать характеристики студентов для УП\n' +
        'Выебри дейтсвие на клавиатуре, или воспользуйся командами',
    forAdmins: "Твой уровень доступа- администратор\n" +
        "Чтобы быстро добавить дело введи:\n" +
        "Д: %whatYourDo%',\n" +
        "Чтобы включить или выключить отображение дат в листе самооценки: /showDate,\n" +
        "Чтобы выгрузить логи: /logs\n" +
        "Список админов можно получить по команде /admins\n" +
        "Или выбери действие:",
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
                    keyboardConstants.VC,
                    keyboardConstants.BELLS,
                    keyboardConstants.JITSY
                ],
                [
                    keyboardConstants.RIGHTS,
                    keyboardConstants.MYSELF,
                    keyboardConstants.REPORTS
                ]
            ]
        }
    },
    forTeachers: {
        "reply_markup": {
            "keyboard": [
                [
                    keyboardConstants.VC,
                    keyboardConstants.BELLS,
                ],
                [
                    keyboardConstants.JITSY,
                    keyboardConstants.MYSELF,
                    keyboardConstants.REPORTS
                ]
            ]
        }
    }
}


module.exports.listsOfRights = {
    students: [keyboardConstants.BELLS, keyboardConstants.VC, '/start', '/help', '/admins', '/getId'],
    teachers: [
        keyboardConstants.RIGHTS,
        keyboardConstants.RIGHTS_USER_CHOISE,
        keyboardConstants.RIGHTS_USER_CLEAR,
        keyboardConstants.RIGHTS_USER_SET_NOTE,
        keyboardConstants.RIGHTS_USER_SET_OPENER,
        keyboardConstants.RIGHTS_USER_SET_STATUS,
        '/logs'
    ],
}

module.exports.keyboardConstants = keyboardConstants;