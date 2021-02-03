const strings = require('../../resources/strings');

module.exports.testUsers = [
    {
        userId: 111,
        status: 'student',
        username: '111',
        firstname: 'f111',
        lastname: '111f',
        note: 'note 111',
        opener: false,
    },
    {
        userId: 222,
        status: 'student',
        username: '222',
        firstname: 'f222',
        lastname: '222f',
        note: 'note 222',
        opener: true,
    },
    {
        userId: 333,
        status: 'teacher',
        username: '333',
        firstname: 'f333',
        lastname: '333f',
        note: 'note 333',
        opener: true,
    },
    {
        userId: 444,
        status: 'teacher',
        username: '444',
        firstname: 'f444',
        lastname: '444f',
        note: 'note 444',
        opener: false,
    },
    {
        userId: 555,
        status: 'admin',
        username: '555',
        firstname: 'f555',
        lastname: '555f',
        note: 'note 555',
    },
    {
        userId: 666,
        status: 'admin',
        username: '666',
        firstname: 'f666',
        lastname: '666f',
        note: 'note 666',
    }
];


module.exports.testDataHasAccess = [
    ['message', strings.keyboardConstants.BELLS],
    ['message', strings.keyboardConstants.JITSY],
    ['message', strings.keyboardConstants.VC, false],
    ['message', strings.keyboardConstants.VC],
    ['message', strings.keyboardConstants.MYSELF],
    ['message', strings.keyboardConstants.RIGHTS],
    ['message', strings.keyboardConstants.REPORTS],
    ['message','/start'],
    ['message','/help'],
    ['message','/admins'],
    ['message','/getId'],
    ['message','/showDate'],
    ['message','Д: 123'],
    ['message','qwerty'],
    ['callback_query', strings.commands.MYSELF_LIST],
    ['callback_query', strings.commands.MYSELF_NEW],
    ['callback_query', strings.commands.MYSELF_CLEAR],
    ['callback_query', strings.commands.MYSELF_GET_FILE],
    ['callback_query', strings.commands.REPORTS_GENERATE],
    ['callback_query', strings.commands.REPORTS_MAN],
    ['callback_query', strings.commands.REPORTS_TEMPLATE],
    ['callback_query', strings.commands.RIGHTS_USER_SET_STATUS],
    ['callback_query', strings.commands.RIGHTS_USER_SET_OPENER],
    ['callback_query', strings.commands.RIGHTS_USER_SET_NOTE],
    ['callback_query', strings.commands.RIGHTS_USER_CLEAR],
    ['callback_query', strings.commands.RIGHTS_USER_CHOISE],
    ['message','/logs'],
];

module.exports.hasAccessForTeachers = [
    true, true, false, true, true, false, true, true, true, true, true, true,
    true, true, true, true, true, true, true, true, true, false, false, false,
    false, false, false,
];

module.exports.hasAccessForStudents = [
    true, false, false, true, false, false, false, true, true, true, true, false,
    false, false, false, false, false, false, false, false, false, false, false,
    false, false, false, false,
];
