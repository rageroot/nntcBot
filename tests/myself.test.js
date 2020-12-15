const myself = require("../helpers/myself");
const fs = require("fs");

describe("Helper \"myself\"", () => {
    describe("Function \"list\"", () => {
        const testData = "[\"test1\",\"test2 test2\",\"test3 test3 test3\"]";
        let readFileCallback;

        const readFileSpy = jest.spyOn(fs, 'readFile')
            .mockImplementationOnce((path, callback) => {
                readFileCallback = callback;
                callback(null, testData);
            }).mockImplementationOnce((path, callback) => {
                callback(new Error("Jest test error"), null);
            });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        test("normal Data",  async () => {
            const r = await myself.list(12345, 'testUser');
            expect(readFileSpy).toBeCalledWith('./myself_lists/12345.txt', readFileCallback);
            expect(r).toContain("1- test1");
            expect(r).toContain("3- test3 test3 test3");
            expect(r).toContain("testUser, ты успел натворить:");
        });

        test("bad Data", async () => {
            const JSONparse = jest.spyOn(JSON, "parse");

            try {
                const r = await myself.list(12345, 'testUser');
            }catch (err) {
                expect(err.message).toContain("У вас нет самооценки");
            }
            expect(JSONparse).not.toHaveBeenCalled();
        });
    });
});
