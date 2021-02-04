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
    describe('function \'hasAccess\'', () => {
        test('student has access', async () => {
            const results = [];
            for(const testData of inputData.testDataHasAccess){
                results.push(await superPower.hasAccess('student', ...testData));
            }
            expect(results).toEqual(inputData.hasAccessForStudents);
        });

        test('teachers has access', async () => {
            const results = [];
            for(const testData of inputData.testDataHasAccess){
                results.push(await superPower.hasAccess('teacher', ...testData));
            }
            expect(results).toEqual(inputData.hasAccessForTeachers);
        });

        test('admins has access', async () => {
            const results = [];
            for(const testData of inputData.testDataHasAccess){
                results.push(await superPower.hasAccess('admin', ...testData));
            }
            expect(results).not.toContain(false);
        });
    });

    describe('function \'getAdmins\'', () => {
        test('get all admins', async () => {
            const res = await superPower.getAdmins();
            expect(res.split('\n')).toEqual(inputData.allAdmins);
        });
    });

    describe('function \'getUserInfo\'', () => {
        test('normal behavior', async () => {
            const studentWithoutDoor = await superPower.getUserInfo(111);
            const studentWithDoor = await superPower.getUserInfo(222);
            const teacher = await superPower.getUserInfo(333);
            const admin = await superPower.getUserInfo(555);
            const wrongUser = await superPower.getUserInfo(123123);

            expect(studentWithoutDoor.split('\n')).toEqual(inputData.getUserInfoStudentWithoutDoor);
            expect(studentWithDoor.split('\n')).toEqual(inputData.getUserInfoStudentWithDoor);
            expect(teacher.split('\n')).toEqual(inputData.getUserInfoTeacher);
            expect(admin).toBe(inputData.getUserInfoAdmin);
            expect(wrongUser).toBe(inputData.getUserInfoWrongUser);
        });
    });

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