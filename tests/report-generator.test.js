const reportGenerator = require('../helpers/report-generator');
const child_process = require('child_process');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios');

const childProcessExecSpy = jest.spyOn(child_process, 'exec');

userId = 12345;

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe("Function \"report-generator\", simple functions", () => {
    test('get manual', () => {
        const template = reportGenerator.manual();
        expect(template).toContain('manual.txt');
    });

    test('get template', () => {
        const template = reportGenerator.template();
        expect(template).toContain('reportTemplate.txt');
    });

    test('garbageCollector, normal', async () => {
        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        });

        await reportGenerator.garbageCollector(userId);
        expect(childProcessExecSpy.mock.calls[0][0]).toBe(`rm -rf tmp/12345_reports`);
    });

    test('garbageCollector, error', () => {
        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(new Error('Jest test error'));
        });

        reportGenerator.garbageCollector(userId).catch((err) => {
            expect(err.message).toContain('не могу собрать мусор');
        });
    });
});


describe("Function \"report-generator\", generator", () => {
    test('normal behavior', async () => {

    });
});