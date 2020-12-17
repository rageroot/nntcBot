const myself = require("../helpers/myself");
const fs = require("fs");
const child_process = require('child_process');

const testData = "[\"test1\",\"test2 test2\",\"test3 test3 test3\"]";
let readFileCallback;

const readFileSpy = jest.spyOn(fs, 'readFile');
const writeFileSpy = jest.spyOn(fs, 'writeFile');
const unlinkSpy = jest.spyOn(fs, 'unlink');
const mkdirSpy = jest.spyOn(fs, 'mkdir');
const execSpy = jest.spyOn(child_process, 'exec');
const JSONparse = jest.spyOn(JSON, 'parse');


afterEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe("Helper \"myself\"", () => {
    describe("Function \"list\"", () => {
            readFileSpy.mockImplementationOnce((path, callback) => {
                readFileCallback = callback;
                callback(null, testData);
            }).mockImplementationOnce((path, callback) => {
                callback(new Error("Jest test error"), null);
            });

        test("normal Data",  async () => {
            const r = await myself.list(12345, 'testUser');
            expect(readFileSpy).toBeCalledWith('./myself_lists/12345.txt', readFileCallback);
            expect(r).toContain("1- test1");
            expect(r).toContain("3- test3 test3 test3");
            expect(r).toContain("testUser, ты успел натворить:");
        });

        test("bad Data", async () => {
            try {
                const r = await myself.list(12345, 'testUser');
            }catch (err) {
                expect(err.message).toContain("У вас нет самооценки");
            }
            expect(JSONparse.mock.calls.length).toBe(0);
        });
    });

    describe("Function \"new\"", () => {
            readFileSpy.mockImplementationOnce((path, callback) => {
                readFileCallback = callback;
                callback(null, testData);
            }).mockImplementation((path, callback) => {
                readFileCallback = callback;
                callback(new Error("file not exist"), null);
            });

            writeFileSpy.mockImplementation((path, data, cb) =>{
                cb(null);
            });

        test("normalData, myselfFile exist", async () => {
            const result = await myself.new(12345, 'testUser', 'any 1 2 3');

            expect(readFileSpy).toBeCalledWith('./myself_lists/12345.txt', readFileCallback);
            expect(writeFileSpy).toHaveBeenCalled();
            expect(result).toBe("testUser, твое дело учтено!");
            expect(writeFileSpy.mock.calls[0][0]).toBe('./myself_lists/12345.txt');
            expect(writeFileSpy.mock.calls[0][1]).toBe("[\"test1\",\"test2 test2\",\"test3 test3 test3\",\"any 1 2 3\"]");
        });

        test("normalData, myselfFile not exist", async () => {
            const result = await myself.new(12345, 'testUser', 'any 1 2 3');

            expect(readFileSpy).toBeCalledWith('./myself_lists/12345.txt', readFileCallback);
            expect(writeFileSpy).toHaveBeenCalled();
            expect(result).toBe("testUser, твое дело учтено!");
            expect(writeFileSpy.mock.calls[0][0]).toBe('./myself_lists/12345.txt');
            expect(writeFileSpy.mock.calls[0][1]).toBe("[\"any 1 2 3\"]");
        });

        test("writeFile Error", () => {
            writeFileSpy.mockImplementation((path, data, cb) =>{
                cb(new Error("Jest test Error"));
            });

            myself.new(12345, 'testUser', 'any 1 2 3')
                .catch((err) => {
                    expect(err.message).toBe("Не могу добавить новое дело");
                });
        });
    });

    describe("Function \"clear\"", () => {
        unlinkSpy.mockImplementationOnce((filename, cb) =>{
                cb(null);
            })
            .mockImplementationOnce((filename, cb) =>{
                cb(new Error("Jest test error"));
            });

        test("Normal behavior", async () => {
            const result = await myself.clear("12345");

            expect(unlinkSpy.mock.calls[0][0]).toBe('./myself_lists/12345.txt');
            expect(result).toBe("Нет у вас больше дел");
        });

        test("Misbehavior", () => {
            myself.clear("12345").catch((err) => {
                expect(err.message).toBe("Не могу удалить файл");
            });
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

    describe("Function \"getMyselfFile\"", () => {
        test("Normal data", async () => {
            const testTemplateData = "<test template xml><text:p text:style-name=\"P1\">-test1</text:p><text:p text:style-name=\"P2\">-test2 test2</text:p><text:p text:style-name=\"P3\">-test3 test3 test3</text:p></office:text></office:body></office:document-content>"

            mkdirSpy.mockImplementation((path, cb) => {
                cb(null);
            });

            execSpy.mockImplementation((command, cb) => {
                cb(null)
            });

            readFileSpy.mockImplementationOnce((path, cb) => {
                cb(null, testData);
            }).mockImplementationOnce((path, cb) => {
                cb(null, "<test template xml>");
            });

            writeFileSpy.mockImplementation((path, data, cb) => {
                cb(null);
            });

            let result = await myself.getMyselfFile(12345);

            expect(mkdirSpy.mock.calls[0][0]).toBe("tmp/12345_self");
            expect(execSpy.mock.calls[0][0]).toBe("cp -r odt_templates/myself/* tmp/12345_self");
            expect(readFileSpy.mock.calls[0][0]).toBe("./myself_lists/12345.txt");
            expect(JSONparse.mock.calls[0][0]).toBe(testData);
            expect(readFileSpy.mock.calls[1][0]).toBe('./tmp/12345_self/content.xml');
            expect(writeFileSpy.mock.calls[0][0]).toBe("./tmp/12345_self/content.xml");
            expect(writeFileSpy.mock.calls[0][1]).toBe(testTemplateData);
            expect(execSpy.mock.calls[1][0]).toBe("cd tmp/12345_self; zip -0 -r ../myself_12345.odt *");
            expect(result).toBe("tmp/myself_12345.odt");
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

        test("Read myself file error", () => {
            readFileSpy.mockImplementationOnce((path, cb) => {
                cb(new Error('Jest test error'), null);
            });

            myself.getMyselfFile(12345).catch(err => {
                expect(err.message).toBe("У вас нет самооценки");
            });
        });

        test("Read template file error", () => {
            readFileSpy.mockImplementationOnce((path, cb) => {
                cb(null, testData);
            }).mockImplementationOnce((path, cb) => {
                cb(new Error('Jest test error'), null);
            });

            myself.getMyselfFile(12345).catch(err => {
                expect(err.message).toBe("Файл шаблона не был создан");
            });
        });

        test("Write result file error", () => {
            readFileSpy.mockImplementation((path, cb) => {
                cb(null, testData)});

            writeFileSpy.mockImplementationOnce((path, data, cb) => {
                cb(new Error('Jest test error'));
            });

            myself.getMyselfFile(12345).catch(err => {
                expect(err.message).toBe("Не могу создать файл");
            });
        });

        test("File packing error", () => {
            execSpy.mockImplementationOnce((command, cb) => {
                        cb(null);
                    }).mockImplementationOnce((command, cb) => {
                        cb(new Error('Jest test error'))});

            myself.getMyselfFile(12345).catch(err => {
                expect(err.message).toBe("Jest test error");
            });
        });
    });
});
