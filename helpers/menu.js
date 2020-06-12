module.exports.main = (api, chatId) => {

    const breadCrumbs = 'Меню';

    //Struct
    const inlineKeyboard = {
        inline_keyboard: [
            [
                {
                    text: 'Открыть IT-Park',
                    callback_data: 'open-itpark'
                },
                {
                    text: 'Открыть Мастерские',
                    callback_data: 'open-m'
                }
            ],
            [
                {
                    text: '1С:Колледж ПРОФ',
                    callback_data: 'cluster-1c'
                }
            ]
        ]
    };

    return api.sendMessage({
        chat_id: chatId,
        text: breadCrumbs,
        reply_markup: JSON.stringify(inlineKeyboard)
    });
};

module.exports.cluster1C = (api, chatId) => {

    const breadCrumbs = '1С:Колледж ПРОФ';

    //Struct
    const inlineKeyboard = {
        inline_keyboard: [
            [
                {
                    text: 'Группы 1 курс',
                    callback_data: 'cluster-1c-gr-1course'
                },
                {
                    text: 'Группы 2 курс',
                    callback_data: 'cluster-1c-gr-2course'
                }
            ],
            [
                {
                    text: 'Группы 3 курс',
                    callback_data: 'cluster-1c-gr-3course'
                },
                {
                    text: 'Группы 4 курс',
                    callback_data: 'cluster-1c-gr-4course'
                }
            ]
        ]
    };

    return api.sendMessage({
        chat_id: chatId,
        text: breadCrumbs,
        reply_markup: JSON.stringify(inlineKeyboard)
    });
};