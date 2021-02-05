const inputData = require('../tests/resources/logs.inputData');
const modelUser = require('../models/users');
const modelLogs = require('../models/logs');
const fs = require('fs').promises;
const logs = require('../helpers/logs');
const mongoose = require('mongoose');

const fsWriteFileSpy = jest.spyOn(fs, 'writeFile');

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
            fsWriteFileSpy.mockResolvedValue('Ok');

            const res = await logs.getLogs(123);

            expect(res).toEqual(['tmp/usersLog123.csv', 'tmp/usageLog123.csv']);
            expect(fsWriteFileSpy.mock.calls[0][0]).toBe('tmp/usersLog123.csv');
            expect(fsWriteFileSpy.mock.calls[1][0]).toBe('tmp/usageLog123.csv');
            expect(fsWriteFileSpy.mock.calls[0][1]).toEqual(inputData.referenceForUsers);
            expect(fsWriteFileSpy.mock.calls[1][1]).toEqual(inputData.referenceForLogs);
        });

        test('error in generateUsersLog', async () => {
            fsWriteFileSpy.mockRejectedValueOnce(new Error('Jest test error'));

            try {
                const res = await logs.getLogs(123);
            }catch (err) {
                expect(err.message).toBe('Jest test error ошибка при создании логов');
            }
        });

        test('error in generateUsageLog', async () => {
            fsWriteFileSpy
                .mockResolvedValueOnce('Ok')
                .mockRejectedValueOnce(new Error('Jest test error'));

            try {
                const res = await logs.getLogs(123);
            }catch (err) {
                expect(err.message).toBe('Jest test error ошибка при создании логов');
            }
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