const inputData = require('../tests/resources/logs.inputData');
const modelUser = require('../models/users');
const modelLogs = require('../models/logs');
const fs = require('fs').promises;
const mongoose = require('mongoose');

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true });
    for(const testUser of inputData.testUsers){
        await modelUser.newUser(testUser);
    }

    for(const testLogs of inputData.testLogs){
        await modelLogs.addLog(testLogs);
    }
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    jest.restoreAllMocks();
    await dropAllCollections();
    await mongoose.connection.close();
});

describe('module \'logs\'', () => {
    describe('function \'getLogs\'', () => {
        test('normal behavior', async () => {

        });
    })
});


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