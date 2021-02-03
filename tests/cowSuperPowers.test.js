const superPower = require('../helpers/cowSuperPowers');
const users = require('../models/users');
const mongoose = require('mongoose');
const inputData = require('../tests/resources/cowSuperPower.inputData');

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true });
    for(const testUser of inputData.testUsers){
        await users.newUser(testUser);
    }
    /*const tmp = await users.getAllUsers();
    console.log(tmp);*/
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    jest.restoreAllMocks();
    await dropAllCollections();
    await mongoose.connection.close();
});

describe('module cowSuperPower', () => {
    describe('function \'getUserInfo\'', () => {
        test('student has access', () => {

        });
    });
});

/*
* const ob = [
    [true, true],
    [false, false]
];

function newf(one, two, three, four = false){
    console.log(one, two, three, four);
}

for(let m of ob){
    newf(true, ...m);
}

* */

async function dropAllCollections () {
    const collections = Object.keys(mongoose.connection.collections)
    for (const collectionName of collections) {
        const collection = mongoose.connection.collections[collectionName]
        try {
            await collection.drop()
        } catch (err) {
            console.log(err.message);
        }
    }
}