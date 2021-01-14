const reportGenerator = require('../helpers/report-generator');
const child_process = require('child_process');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios');
const { PassThrough } = require('stream');
const testData = require('resources/report-generator.inputData');

const childProcessExecSpy = jest.spyOn(child_process, 'exec');
const fsPromiseMkDirSpy = jest.spyOn(fsPromises, 'mkdir');
const fsPromiseReadFileSpy = jest.spyOn(fsPromises, 'readFile');
const fsCreateWriteStreamSpy = jest.spyOn(fs, 'createWriteStream');

jest.mock('axios');

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
        fsPromiseMkDirSpy.mockImplementation((path) => {
            return new Promise((resolve => {
                resolve();
            }));
        });

        /***********function downloadFile***************/
        const mockWriteable = new PassThrough();
        const mockReadable = new PassThrough();
        axios.get.mockResolvedValue(mockReadable);

        fsCreateWriteStreamSpy.mockReturnValueOnce(mockWriteable);
        /***********function downloadFile**************/

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.CONTENT_XML);

        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        });

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        const result = await reportGenerator.generate(userId, {file_path: 'test.txt'});

        expect(fsPromiseMkDirSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports`);
        expect(fsPromiseMkDirSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/outcome`);
        expect(fsCreateWriteStreamSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/inputFile.txt`);
        expect(child_process.mock.calls[0][0]).toBe(`odt_templates/reportsGenerator/odtHarTemplate`);
        expect(child_process.mock.calls[0][1]).toBe(`tmp/${userId}_reports/templateWithGeneralData`);

    });
});
