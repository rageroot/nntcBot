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
        status: 'teacher',
        username: '222',
        firstname: 'f222',
        lastname: '222f',
        note: 'note 222',
        opener: true,
    }
];

module.exports.testLogs = [
    {
        time: 1612201870176,
        note: "test, test, test",
        userId: 123,
        username: "123",
        realname: "f123 123f",
        messageType: "message",
        message: "/getId",
    },
    {
        time: 1612201812345,
        note: "test. test. test",
        userId: 456,
        username: "456",
        realname: "f456 456f",
        messageType: "message",
        message: "/help",
    },
];