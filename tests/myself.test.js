const myself = require("../helpers/myself");
const fs = require("fs");

const testData = "[\"test1\",\"test2 test2\",\"test3 test3 test3\"]";
let readFileCallback;

const readFileSpy = jest.spyOn(fs, 'readFile');
const writeFileSpy = jest.spyOn(fs, 'writeFile');
const unlinkSpy = jest.spyOn(fs, 'unlink');
const JSONparse = jest.spyOn(JSON, "parse");

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
        unlinkSpy
            .mockImplementationOnce((filename, cb) =>{
                cb(null);
            })
            .mockImplementationOnce((filename, cb) =>{
                cb(new Error("Jest test error"));
            });

        test("normal behavior", async () => {
            const result = await myself.clear("12345");

            expect(unlinkSpy.mock.calls[0][0]).toBe('./myself_lists/12345.txt');
            expect(result).toBe("Нет у вас больше дел");
        });

        test("misbehavior", () => {
            myself.clear("12345").catch((err) => {
                expect(err.message).toBe("Не могу удалить файл");
            });


        });
    });
});
