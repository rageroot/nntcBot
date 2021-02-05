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

module.exports.referenceForUsers =
    "userId,status,Name,userName,opener,note\n" +
    "111,student,f111 111f,111,false,note 111\n" +
    "222,teacher,f222 222f,222,true,note 222";
module.exports.referenceForLogs =
    "userId,username,realname,time,messageType,message,note\n" +
    "123,123,f123 123f,Mon Feb 01 2021 20:51:10 GMT+0300 (GMT+03:00),message,/getId,test. test. test\n" +
    "456,456,f456 456f,Mon Feb 01 2021 20:50:12 GMT+0300 (GMT+03:00),message,/help,test. test. test";