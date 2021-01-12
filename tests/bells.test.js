const bells = require("../helpers/bells");

describe("Helper \"bells\"", () => {
    let fakeDate = new Date(Date.parse('2020-12-11T07:00:00'));
    const dateSpy = jest.spyOn(global, 'Date');
    dateSpy.mockImplementation(() => fakeDate);
    let nextTime = 0;
    
    afterEach(() => {
        fakeDate.setMinutes((fakeDate.getMinutes() + nextTime));
    });

    afterAll(() => {
        dateSpy.mockReset();
    });

    test("Before class", async () => {
        nextTime = 75;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Еще слишком рано");
        expect(bellsRequest).not.toContain("==>");
    });

    test("1 lesson", async () => {
        nextTime = 90;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сейчас 1 пара, до конца 85 минут");
        expect(bellsRequest).toContain("==> <b>1 пара:</b> 08:10 - 09:40");
    });

    test("1 change", async () => {
        nextTime = 10;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сейчас 1 перемена, до конца 5 минут");
        expect(bellsRequest).not.toContain("==>");
    });

    test("2 lesson", async () => {
        nextTime = 90;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сейчас 2 пара, до конца 85 минут");
        expect(bellsRequest).toContain("==> <b>2 пара:</b> 09:50 - 11:20");
    });

    test("2 change", async () => {
        nextTime = 700;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сейчас 2 перемена, до конца 15 минут");
        expect(bellsRequest).not.toContain("==>");
    });

    test("After class", async () => {
       // nextTime = 2100;
        nextTime = 630;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Уже слишком поздно");
        expect(bellsRequest).not.toContain("==>");
    });

    test("saturday 1 lesson", async () => {
        nextTime = 210;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сейчас 1 пара, до конца 5 минут");
        expect(bellsRequest).toContain("==> <b>1 пара:</b> 08:10 - 09:40");
        expect(bellsRequest).toContain("<b>3 пара:</b> 11:30 - 13:00")
    });

    test("saturday after class", async () => {
        nextTime = 1200;
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Уже слишком поздно");
        expect(bellsRequest).not.toContain("==>");
    });

    test("Sunday", async () => {
        const bellsRequest = await bells.info();
        expect(bellsRequest).toContain("Сегодня выходной");
        expect(bellsRequest).not.toContain("==>");
    });
});