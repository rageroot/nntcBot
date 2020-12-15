const jitsi = require("../helpers/jitsi");
const child_process = require('child_process');

const testData = "[[[{\"roomname\":\"test1\"}]]," +
    "[[{\"roomname\":\"org.jitsi.jicofo.health/sdfasfasd\"}]]," +
    "[[{\"roomname\":\"test2\"}]],[[{\"roomname\":\"test3\"}]]," +
    "[[{\"roomname\":\"org.jitsi.jicofo.health/34545345\"}]]]";

child_process.execSync = jest.fn()
    .mockReturnValueOnce(testData)
    .mockReturnValueOnce("[[[]]]")
    .mockReturnValue(new Error("Jest test error"));

describe("Helper \"jitsi\"", () => {
    afterAll(() => {
        child_process.execSync.mockReset();
    });

    test("normal data", async () => {
        const testString = await jitsi.health();
        expect(testString).toContain("https://online.nntc.nnov.ru/test1");
        expect(testString).toContain("https://online.nntc.nnov.ru/test2");
        expect(testString).toContain("https://online.nntc.nnov.ru/test3");
        expect(testString).not.toContain("org.jitsi.jicofo.health");
    });

    test("empty data", async () => {
        const testString = await jitsi.health();
        expect(testString).toContain("конференции пока не идут");
    });

    test("error data", async () => {
        try {
            const testString = await jitsi.health();
        }catch (err) {
            expect(err).toThrow("Jest test error");
        }
    });

});

