const reportGenerator = require('../helpers/report-generator');
const child_process = require('child_process');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios');
const { PassThrough } = require('stream');
const testData = require('../tests/resources/report-generator.inputData');

const childProcessExecSpy = jest.spyOn(child_process, 'exec');
const fsPromiseMkDirSpy = jest.spyOn(fsPromises, 'mkdir');
const fsPromiseReadFileSpy = jest.spyOn(fsPromises, 'readFile');
const fsPromiseWriteFileSpy = jest.spyOn(fsPromises, 'writeFile');
const fsCreateWriteStreamSpy = jest.spyOn(fs, 'createWriteStream');

jest.mock('axios');

userId = 12345;

/***********function downloadFile***************/
const mockWriteable = new PassThrough();
mockWriteable.close = function (){};
const mockReadable = new PassThrough();
const fakeReadStream = {
    data: mockReadable
};

axios.get.mockResolvedValue(fakeReadStream);
fsCreateWriteStreamSpy.mockReturnValue(mockWriteable);
/***********function downloadFile**************/


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


describe("Function \"report-generator\", normal behavior", () => {
    test('normal behavior', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            cb(null);
        });

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        const result = await reportGenerator.generate(userId, {file_path: 'test.txt'});

        expect(fsPromiseMkDirSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports`);
        expect(fsPromiseMkDirSpy.mock.calls[1][0]).toBe(`tmp/${userId}_reports/outcome`);
        expect(fsCreateWriteStreamSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/inputFile.txt`);
        expect(childProcessExecSpy.mock.calls[0][0]).toBe(`cp -r odt_templates/reportsGenerator/odtHarTemplate tmp/${userId}_reports/templateWithGeneralData`);
        expect(fsPromiseReadFileSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/inputFile.txt`);
        expect(fsPromiseReadFileSpy.mock.calls[1][0]).toBe(`tmp/${userId}_reports/templateWithGeneralData/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[0][0]).toBe(`tmp/${userId}_reports/templateWithGeneralData/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[1][1]).toBe(testData.STUDENTS_CORRECT_OUTPUT);
        expect(childProcessExecSpy.mock.calls[1][0]).toBe(`cd tmp/${userId}_reports/templateWithGeneralData;zip -0 -r ../\'outcome/Богатов Михаил.odt\' *`);
        expect(childProcessExecSpy.mock.calls[2][0]).toContain('Васин Александр');
        expect(childProcessExecSpy.mock.calls[3][0]).toContain('Вишняков Олег');
        expect(childProcessExecSpy.mock.calls[4][0]).toBe(`cp -r odt_templates/reportsGenerator/odtOtchRukTemplate tmp/${userId}_reports/teacherReport`);
        expect(fsPromiseWriteFileSpy.mock.calls[3][0]).toBe(`tmp/${userId}_reports/teacherReport/content.xml`);
        expect(fsPromiseWriteFileSpy.mock.calls[3][1]).toBe(testData.TEACHERS_CORRECT_OUTPUT);
        expect(childProcessExecSpy.mock.calls[5][0]).toBe(`cd tmp/${userId}_reports/teacherReport;zip -0 -r ../'outcome/teacherReport.odt' *`);
        expect(childProcessExecSpy.mock.calls[6][0]).toBe(`cd tmp/${userId}_reports/outcome;7z a -tzip ../\'5РА-16-1уп.zip\'`);
        expect(result).toBe(`tmp/${userId}_reports/5РА-16-1уп.zip`);
    });
});

describe("Function \"report-generator\", errors", () => {
    beforeEach(() => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            cb(null);
        });

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);
    });

    test('Incorrect input file type', async () => {
        try {
            await reportGenerator.generate(userId, {file_path: 'test'});
        }catch (err) {
            expect(err.message).toBe('Файл не правильного формата');
        }
    });

    test('Cant create work folder', async () => {
        fsPromiseMkDirSpy.mockRejectedValueOnce(new Error('Jest test error'));

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Jest test error');
        }
    });

    test('Cant create outcome folder', async () => {
        fsPromiseMkDirSpy
            .mockResolvedValueOnce('ok')
            .mockRejectedValueOnce(new Error('Jest test error'));

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Jest test error');
        }
    });

    test('Cant save downloads file', async () => {
        setTimeout(() => {
            mockWriteable.emit('error', new Error('Jest test error'));
        }, 5);

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Не могу скачать файл Jest test error');
        }
    });

    test('Cant  download file', async () => {
        axios.get.mockRejectedValueOnce(new Error('Jest test error'));

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Не могу скачать файл Jest test error');
        }
    });

    test('Cant read download file', async () => {
        fsPromiseReadFileSpy.mockRejectedValueOnce(new Error('Jest test error'));

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Jest test error');
        }
    });

    test('Invalid input data. Not enough fields', async () => {
        fsPromiseReadFileSpy.mockResolvedValueOnce(testData.INPUT_FILE_NOT_FIELD);

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Не корректно заполнен шаблон');
        }
    });

    test('Invalid input data. Not enough students', async () => {
        fsPromiseReadFileSpy.mockResolvedValueOnce(testData.INPUT_FILE_NOT_STUDENTS);

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Не корректно заполнен шаблон');
        }
    });

    test('Cant copy characteristics template', async () => {
        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(new Error('Jest test error'));
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Не могу скопировать файл шаблона');
        }
    });

    test('Cant read characteristics xml file', async () => {
        fsPromiseReadFileSpy.mockReset();
        fsPromiseReadFileSpy.mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockRejectedValueOnce(new Error('Jest test error'));

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Jest test error');
        }
    });

    /*test('Cant write characteristics xml file', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockRejectedValueOnce(new Error('Jest test error'));

        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Jest test error');
        }
    });

    test('Cant zip characteristics', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementationOnce((command, cb) => {
            cb(null);
        }).mockImplementationOnce((command, cb) => {
            cb(new Error('Jest test error'));
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Не могу запаковать в odt');
        }
    });

    test('Cant copy teacher template', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            if(command.endsWith('teacherReport')){
                cb(new Error('Jest test error'));
            }else {
                cb(null);
            }
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Не могу скопировать файл шаблона');
        }
    });

    test('Cant read teacher content xml file', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockRejectedValueOnce(new Error('Jest test error'));

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            cb(null);
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Jest test error');
        }
    });

    test('Cant write teacher content xml file', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CORRECT_OUTPUT);

        fsPromiseWriteFileSpy.mockImplementation((path, data) => {
            return new Promise((resolve, reject) => {
                if(path.endsWith('/teacherReport/content.xml')){
                    reject(new Error('Jest test error'));
                }else{
                    resolve();
                }
            });
        });

        childProcessExecSpy.mockImplementation((command, cb) => {
            cb(null);
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Jest test error');
        }
    });

    test('Cant zip teacher report', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CORRECT_OUTPUT);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            if(command.includes('teacherReport.odt')){
                cb(new Error('Jest test error'));
            }else {
                cb(null);
            }
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Возникли проблемы с генерацией отчетов Не могу запаковать в odt');
        }
    });

    test('Cant final zip', async () => {
        fsPromiseMkDirSpy.mockResolvedValue('ok');

        setTimeout(() => {
            mockWriteable.emit('finish');
        }, 50);

        fsPromiseReadFileSpy
            .mockResolvedValueOnce(testData.INPUT_FILE_NORMAL)
            .mockResolvedValueOnce(testData.STUDENTS_CONTENT_XML)
            .mockResolvedValueOnce(testData.TEACHERS_CORRECT_OUTPUT);

        fsPromiseWriteFileSpy.mockResolvedValue('done');

        childProcessExecSpy.mockImplementation((command, cb) => {
            if(command.includes('7z a -tzip')){
                cb(new Error('Jest test error'));
            }else {
                cb(null);
            }
        });

        try {
            await reportGenerator.generate(userId, {file_path: 'test.txt'});
        }catch (err) {
            expect(err.message).toBe('Не могу запаковать в zip');
        }
    });*/
});