const myself = require("../helpers/myself");
const fs = require("fs");
const child_process = require('child_process');
const modelMyself = require('../models/mySelf');
const modelUser = require('../models/users');
const mongoose = require('mongoose');

const testModelMyselfResponse = {
    userId: 12345,
    affairs: [
        {
            affair: 'Тестовое дело 1',
            date: '11 января'
        },
        {
            affair: 'Тестовое дело 2',
            date: '12 января'
        },
        {
            affair: 'Тестовое дело 3',
            date: '13 января'
        }
    ]
};

const readFileSpy = jest.spyOn(fs, 'readFile');
const writeFileSpy = jest.spyOn(fs, 'writeFile');
const mkdirSpy = jest.spyOn(fs, 'mkdir');
const execSpy = jest.spyOn(child_process, 'exec');
const dateNowSpy = jest.spyOn(Date, 'now');
const modelUserGetSpy = jest.spyOn(modelUser, 'get');
const modelMyselfGetSpy = jest.spyOn(modelMyself, 'get');

beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true });
    await modelUser.newUser(12345);
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    jest.restoreAllMocks();
    await dropAllCollections();
    await mongoose.connection.close();
});

describe("Helper \"myself\"", () => {
    describe("Function \"list\"", () => {
        test("normal data without date",  async () => {
            modelMyselfGetSpy.mockImplementationOnce((userId) => {
                return testModelMyselfResponse;
            });

            modelUserGetSpy.mockImplementationOnce((userId) => {
                return {
                    userId: 12345,
                    showDate: false
                }
            });

            const r = await myself.list(12345, 'testUser');
            expect(r).toContain("1- Тестовое дело 1");
            expect(r).toContain("3- Тестовое дело 3");
            expect(r).toContain("testUser, ты успел натворить:");
        });

        test("normal data with date",  async () => {
            modelMyselfGetSpy.mockImplementationOnce((userId) => {
                return testModelMyselfResponse;
            });

            modelUserGetSpy.mockImplementationOnce((userId) => {
                return {
                    userId: 12345,
                    showDate: true
                }
            });

            const r = await myself.list(12345, 'testUser');
            expect(r).toContain("1- \"11 января\" Тестовое дело 1");
            expect(r).toContain("3- \"13 января\" Тестовое дело 3");
            expect(r).toContain("testUser, ты успел натворить:");
        });

        test("bad data", async () => {
            modelMyselfGetSpy.mockImplementationOnce((userId) => {
                return testModelMyselfResponse;
            });

            modelUserGetSpy.mockImplementationOnce((userId) => {
                return new Error("Jest test error");
            });

            await myself.list(12345, 'testUser').
            catch((err) => {
                expect(err.message).toContain("Jest test error");
            });

        });
    });

    describe("Function \"new\"", () => {
        dateNowSpy.mockImplementation(() => {
            return new Date('2021-01-01T07:00:00');
        });

        test("normalData, bd is empty", async (done) => {
            const result = await myself.new(12345, 'testUser', 'any 1 2 3');

            const bdResponse = await modelMyself.get(12345);

            expect(result).toBe("testUser, твое дело учтено!");
            expect(bdResponse.userId).toBe(12345);
            expect(bdResponse.affairs[0].affair).toBe('any 1 2 3');
            expect(bdResponse.affairs[0].date).toBe('1 Января');
            done();
        });

        test("normalData, bd have one entry", async (done) => {
            const result = await myself.new(12345, 'testUser', '3 2 1 yna');

            const bdResponse = await modelMyself.get(12345);

            expect(result).toBe("testUser, твое дело учтено!");
            expect(bdResponse.userId).toBe(12345);
            expect(bdResponse.affairs[0].affair).toBe('any 1 2 3');
            expect(bdResponse.affairs[0].date).toBe('1 Января');
            expect(bdResponse.affairs[1].affair).toBe('3 2 1 yna');
            expect(bdResponse.affairs[1].date).toBe('1 Января');
            done();
        });

      /*  test("save error", async () => {
            mongooseSaveSpy.mockImplementationOnce(() => {
                return new Error('Jest test error');
            });

            await myself.new(12345, 'testUser', '3 2 1 yna').
            catch((err) => {
                expect(err.message).toContain("Jest test error");
            });
        });*/
    });

    describe("Function \"clear\"", () => {

        test("Normal behavior", async () => {
            const result = await myself.clear("12345");

            const bdResponse = await modelMyself.get(12345);

            expect(bdResponse.affairs.length).toBe(0);
            expect(result).toBe("Нет у вас больше дел");
        });

    });

    describe("Function \"garbageCollector\"", () => {
        execSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        }).mockImplementationOnce((command, cb) => {
            cb(new Error("Jest test error"));
        });

        test("Normal behavior", async () => {
            const result = await myself.garbageCollector(12345);

            expect(execSpy.mock.calls[0][0]).toBe("rm -rf tmp/12345_self tmp/myself_12345.odt");
            expect(result).toBeUndefined();
       });

        test("Mistbehavior", () => {
            myself.garbageCollector(12345).catch((err) => {
                expect(err.message).toBe("не могу собрать мусор");
            });
        });
    });
});

describe("Function \"getMyselfFile\"", () => {
    afterAll(() => {
        modelMyselfGetSpy.mockRestore();
    });

    test("Normal data without date", async () => {
        const testTemplateData = "<test template xml><text:p text:style-name=\"P1\">-  Тестовое дело 1</text:p><text:p text:style-name=\"P2\">-  Тестовое дело 2</text:p><text:p text:style-name=\"P3\">-  Тестовое дело 3</text:p></office:text></office:body></office:document-content>"

        mkdirSpy.mockImplementation((path, cb) => {
            cb(null);
        });

        execSpy.mockImplementation((command, cb) => {
            cb(null)
        });

        readFileSpy.mockImplementationOnce((path, cb) => {
            cb(null, "<test template xml>");
        });

        writeFileSpy.mockImplementation((path, data, cb) => {
            cb(null);
        });

        modelMyselfGetSpy.mockImplementation((userId) => {
            return testModelMyselfResponse;
        });

        modelUserGetSpy.mockImplementation((userId) => {
            return {
                userId: 12345,
                showDate: false
            }
        });

        let result = await myself.getMyselfFile(12345);

        expect(mkdirSpy.mock.calls[0][0]).toBe("tmp/12345_self");
        expect(execSpy.mock.calls[0][0]).toBe("cp -r odt_templates/myself/* tmp/12345_self");
        expect(readFileSpy.mock.calls[0][0]).toBe('./tmp/12345_self/content.xml');
        expect(writeFileSpy.mock.calls[0][0]).toBe("./tmp/12345_self/content.xml");
        expect(writeFileSpy.mock.calls[0][1]).toBe(testTemplateData);
        expect(execSpy.mock.calls[1][0]).toBe("cd tmp/12345_self; zip -0 -r ../myself_12345.odt *");
        expect(result).toBe("tmp/myself_12345.odt");
    });

    test("Normal data with date", async () => {
        readFileSpy.mockImplementationOnce((path, cb) => {
            cb(null, "<test template xml>");
        });

        modelUserGetSpy.mockImplementationOnce((userId) => {
            return {
                userId: 12345,
                showDate: true
            }
        });

        const testTemplateData = "<test template xml><text:p text:style-name=\"P1\">- \"11 января\" Тестовое дело 1</text:p><text:p text:style-name=\"P2\">- \"12 января\" Тестовое дело 2</text:p><text:p text:style-name=\"P3\">- \"13 января\" Тестовое дело 3</text:p></office:text></office:body></office:document-content>"

        let result = await myself.getMyselfFile(12345);

        expect(writeFileSpy.mock.calls[0][1]).toBe(testTemplateData);
    });

    test("MkDir error", () => {
        mkdirSpy.mockImplementationOnce((path, cb) => {
            cb(new Error('Jest test error'));
        });

        myself.getMyselfFile(12345).catch(err => {
            expect(err.message).toBe("Не могу создать папку tmp/12345_self");
        });
    });

    test("Copy template error", () => {
        execSpy.mockImplementationOnce((command, cb) => {
            cb(new Error('Jest test error'));
        });

        myself.getMyselfFile(12345).catch(err => {
            expect(err.message).toBe("Не могу скопировать файл шаблонов");
        });
    });

    test("Read template file error", () => {
        readFileSpy.mockImplementationOnce((path, cb) => {
            cb(new Error('Jest test error'), null);
        });

        myself.getMyselfFile(12345).catch(err => {
            expect(err.message).toBe("Файл шаблона не был создан");
        });
    });

    test("Write result file error", () => {
        readFileSpy.mockImplementationOnce((path, cb) => {
            cb(null, "<test template xml>");
        });

        writeFileSpy.mockImplementationOnce((path, data, cb) => {
            cb(new Error('Jest test error'));
        });

        myself.getMyselfFile(12345).catch(err => {
            expect(err.message).toBe("Не могу создать файл");
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