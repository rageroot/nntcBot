const strings = require("../resources/strings");
const config = require("../resources/config");
const child_process = require('child_process');
const fsPromises = require('fs').promises;
const fs = require('fs');
const axios = require('axios');

/**
 * Возвращает файл с инструкцией
 * @returns {string}
 */
module.exports.manual = function(){
    return strings.textConstants.REPORTS_GENERATE_MANUAL_FILE;
}

/**
 * Возвращает файл с шаблоном для заполнения
 * @returns {string}
 */
module.exports.template = function(){
    return strings.textConstants.REPORTS_GENERATE_TEMPLATE_TXT;
}

/**
 * Возвращает ссылку на архив со сгенерированными файлами
 * @param userId
 * @param tfr - telegramFileResponse, объект с ответом телеграмма на запрос о подготовке файла к скачиванию
 * @returns {Promise<unknown>}
 */
module.exports.generate = function(userId, tfr){
    return new Promise(async (resolve, reject) => {
        const paths = {
            tmpFolderPath: `tmp/${userId}_reports`,
            outcomeDir: `tmp/${userId}_reports/outcome`,
            reportsCharacteristicTemplate: 'odt_templates/reportsGenerator/odtHarTemplate',
            reportsTeacherTemplate: 'odt_templates/reportsGenerator/odtOtchRukTemplate'
        }

        if(!tfr.file_path.endsWith('.txt')){
            reject(new Error('Файл не правильного формата'));
        }

        try{
            await fsPromises.mkdir(paths.tmpFolderPath);
            await fsPromises.mkdir(paths.outcomeDir);
            const inputDataFile = await downloadFile(tfr.file_path, paths.tmpFolderPath);
            let inputFileText = await fsPromises.readFile(inputDataFile);
            inputFileText = inputFileText.toString().replace(/\n/g, '').split(';');
            const parseText = await inputParser(inputFileText);
            await validator(parseText);

            await createCharacteristics(parseText, paths);
            await createTeachersReport(parseText, paths);

            await packer(paths.outcomeDir, `\'${parseText.group}.zip\'`, '7zip')

            resolve(`${paths.tmpFolderPath}/${parseText.group}.zip`);
        }catch (err) {
            reject(err);
        }

    })
}

/**
 * Сборщик мусора
 * @param userId
 * @returns {Promise<void>}
 */
module.exports.garbageCollector = async function (userId){
    const tmpPath = `tmp/${userId}_reports`;
    child_process.exec(`rm -rf ${tmpPath}`,(err) => {
        if(err){
            throw new Error("не могу собрать мусор");
        }
    });
}

/**
 * Загрузка подготовленного файла
 * @param filePathOnTelegramServer
 * @param folderOnLocal
 * @returns {Promise<unknown>}
 */
function downloadFile(filePathOnTelegramServer, folderOnLocal){
    return new Promise((resolve, reject) => {
        const botToken = config.TG_TOKEN;
        const downloadLink = `https://api.telegram.org/file/bot${botToken}/${filePathOnTelegramServer}`;
        const writer = fs.createWriteStream(`${folderOnLocal}/inputFile.txt`);
        axios.get(downloadLink, {responseType: 'stream'})
            .then(response => {
                response.data.pipe(writer);

                writer.on('error', err => {
                    writer.close();
                    reject(new Error(`Не могу скачать файл ${err.message}`));
                });

                writer.on('finish', () => {
                    resolve(`${folderOnLocal}/inputFile.txt`);
                });
            })
            .catch(err => {
                reject(new Error(`Не могу скачать файл ${err.message}`));
            });
    });
}

/**
 * Возвращает объект, содержащий в себе содержимое текста из входного файла-шаблона,
 * разбитое по соответсвующим свойствам
 * @param source
 * @returns {Promise<unknown>}
 * {
 *     group: <string>,
 *     codeSpec: <string>,
 *     spec: <string>,
 *     cource: <string>,
 *     hours: <string>,
 *     pm: <string>,
 *     begin: <string>,
 *     end: <string>,
 *     leader: <string>,
 *     leadPosition: <string>,
 *     pk: <string>,
 *     students: [],
 *     grades: []
 * }
 */
function inputParser(source){
    return new Promise(resolve => {
        let result = {
            students: [],
            grades: [],
            pk: []
        };

        source.forEach(element => {
            const indexOfCoon = element.indexOf(':');
            const prefix = element.substring(0, indexOfCoon);
            const data = element.substring(indexOfCoon + 1).trim();
            switch (prefix){
                case 'Группа':
                    result.group = data;
                    break;
                case 'Код_специальности':
                    result.codeSpec = data;
                    break;
                case 'Название_специальности':
                    result.spec = data;
                    break;
                case 'Курс':
                    result.cource = data;
                    break;
                case 'Часов_по_плану':
                    result.hours = data;
                    break;
                case 'ПМ':
                    result.pm = data;
                    break;
                case 'Начало':
                    result.begin = data;
                    break;
                case 'Конец':
                    result.end = data;
                    break;
                case 'Руководитель':
                    result.leader = data;
                    break;
                case 'Должность':
                    result.leadPosition = data;
                    break;
                case 'ПК':
                    result.pk.push(data);
                    break;
                case 'Студент':
                    result.students.push(data);
                    break;
                case 'Оценка':
                    result.grades.push(data);
                    break;
                default: break;
            }
        });
        resolve(result);
    });
}

/**
 * Копирует папку с шаблонами во временную директорию
 * @param from
 * @param to
 * @returns {Promise<unknown>}
 */
function cpTemplate(from, to){
    return new Promise((resolve, reject) => {
        const command = `cp -r ${from} ${to}`;
        child_process.exec(command, (err) => {
            if(err){
                reject(new Error('Не могу скопировать файл шаблона'));
            }
            resolve();
        });
    });
}

/**
 * Создает характеристики на каждого студента
 * 1- копиует шаблон, заполняет общими для всех данными
 * 2- вносит уникальный для каждого студента данные
 * 3- собирает всю папку шаблона в odt
 * @param info ссылка на объект с входными данными, взятыми из присланного пользователем файла
 * @param paths ссылка на объект путей к рабочим директориям
 * @returns {Promise<unknown>}
 */
function createCharacteristics(info, paths){
    return new Promise(async (resolve, reject) => {
        const contentXmlPath = `${paths.tmpFolderPath}/templateWithGeneralData/content.xml`;
        try {
            await cpTemplate(paths.reportsCharacteristicTemplate, `${paths.tmpFolderPath}/templateWithGeneralData`);
            const contentGeneralFile = await fsPromises.readFile(contentXmlPath);
            const totalsGeneral = await fillingCharacteristicsWithGeneralData(contentGeneralFile.toString(), info);

            let index = 0;
            for(const student of info.students) {
                const totals = await fillingCharacteristicsWithUnicalsData(totalsGeneral, index, info);
                await fsPromises.writeFile(contentXmlPath, totals)
                await packer(`${paths.tmpFolderPath}/templateWithGeneralData`, `\'outcome/${info.students[index]}.odt\'`);
                index++;
            }
        } catch (err) {
            reject(new Error("Возникли проблемы с генерацией отчетов " + err.message));
        }
        resolve();
    });
}

/**
 * Заполняет шаблон одинаковыми для всех данными, чтобы не повторять одну работу много раз.
 * @param template
 * @param info
 * @returns {Promise<unknown>}
 */
function fillingCharacteristicsWithGeneralData(template, info){
    return new Promise((resolve, reject) => {
        //создание верстки для таблицы с неизвестным заранее количестве ПК
        const beforePk = "<table:table-row table:style-name=\"Таблица4.2\"><table:table-cell table:style-name=\"Таблица4.A2\" office:value-type=\"string\"><text:p text:style-name=\"P19\">";
        const afterPk =  "</text:p></table:table-cell><table:table-cell table:style-name=\"Таблица4.A2\" office:value-type=\"string\"><text:p text:style-name=\"P30\">scale</text:p></table:table-cell><table:table-cell table:style-name=\"Таблица4.C2\" office:value-type=\"string\"><text:p text:style-name=\"P27\"/></table:table-cell></table:table-row>";
        const pk = [];
        for(const competence of info.pk){
            pk.push(beforePk + competence + afterPk);
        }

        const result = template
            .replace(/\$group\$/g, info.group)
            .replace(/\$codeSpec\$/g, info.codeSpec)
            .replace(/\$specGroup\$/g, info.spec)
            .replace(/\$pModule\$/g, info.pm)
            .replace(/\$startDate\$/g, info.begin)
            .replace(/\$endDate\$/g, info.end)
            .replace(/\$leader\$/g, info.leader)
            .replace(/\$leadPosition\$/g, info.leadPosition)
            .replace(/\$row\$/g, pk.join(""))
        resolve(result);
    });
}

/**
 * Возвращает заполненные уникальными для каждого студента данными
 * @param template верстка с шаблоном
 * @param index номер текущей итерации
 * @param info объект реальных данных
 * @returns {Promise<unknown>} заполненный шаблон
 */
function fillingCharacteristicsWithUnicalsData(template, index, info){
   return new Promise(resolve => {
       //подчеркивание нужной оценки в таблицах
       const beforeGrade = "<text:span text:style-name=\"T25\">";
       const afterGrade = "</text:span>";
       const grades = [0, 1, 2, 3, 4, 5];
       grades[+info.grades[index]] = beforeGrade + grades[+info.grades[index]] + afterGrade;

       //установка маркера в нужной позиции соответсвующих таблиц
       const gradeMarker = {
           five: "",
           four: "",
           three: "",
           two: ""
       };

       switch (info.grades[index]){
           case '5':
               gradeMarker.five = "X";
               break;
           case '4':
               gradeMarker.four = "X";
               break;
           case '3':
               gradeMarker.three = "X";
               break;
           default:
               gradeMarker.two = "X";
               break
       }

       const result = template
           .replace(/\$studentName\$/g, info.students[index])
           .replace(/\$f\$/g, gradeMarker.five)
           .replace(/\$nf\$/g, gradeMarker.four + gradeMarker.three)
           .replace(/\$no\$/g, gradeMarker.two)
           .replace(/\$fiv\$/g, gradeMarker.five)
           .replace(/\$fou\$/g, gradeMarker.four)
           .replace(/\$thr\$/g, gradeMarker.three)
           .replace(/\$tw\$/g, gradeMarker.two)
           .replace(/scale/g, grades.join(" "));
       resolve(result);
   });
}

/**
 * Запаковывает файли из input в output.
 * ВАЖНО- из input делает шаг назад, далее корнем считается каталог перед input
 * @param input
 * @param output
 * @param compressor выбор архиватора. По умолчанию zip. Для верной кодировки русских символов в архиве требуется выбирать
 * 7zip.
 * @returns {Promise<unknown>}
 */
function packer(input, output, compressor){
    compressor = compressor || 'zip';
    let errMessage = "Не могу запаковать в odt"
    return new Promise(((resolve, reject) => {
        let command = `cd ${input};`;
        if(compressor === '7zip'){
            command += `7z a -tzip ../${output}`;
            errMessage = "Не могу запаковать в zip";
        }
        else {
            command += `zip -0 -r ../${output} *`;
        }
        child_process.exec(command, err => {
            if(err){
                reject(new Error(errMessage))
            }
            resolve();
        });
    }));
}

/**
 * Создает отчет руководителя
 * @param info ссылка на объект с входными данными, взятыми из присланного пользователем файла
 * @param paths ссылка на объект путей к рабочим директориям
 * @returns {Promise<unknown>}
 */
function createTeachersReport(info, paths){
    return new Promise(async (resolve, reject) => {
        try {
            await cpTemplate(paths.reportsTeacherTemplate, `${paths.tmpFolderPath}/teacherReport`);
            const contentFile = await fsPromises.readFile(`${paths.tmpFolderPath}/teacherReport/content.xml`);
            const totals = await fillingTeacherReportWithRealData(contentFile.toString(), info);
            await fsPromises.writeFile(`${paths.tmpFolderPath}/teacherReport/content.xml`, totals)
            await packer(`${paths.tmpFolderPath}/teacherReport`, `\'outcome/teacherReport.odt\'`);

        } catch (err) {
            reject(new Error("Возникли проблемы с генерацией отчетов " + err.message));
        }
    resolve();
    });
}

/**
 *
 * Возвращает заполненные реальными данными шаблон
 * @param template верстка с шаблоном
 * @param info объект реальных данных
 * @returns {Promise<unknown>} заполненный шаблон
 */
function fillingTeacherReportWithRealData(template, info){
    return new Promise((resolve) => {
        const gradeCount = {
            five: 0,
            four: 0,
            three: 0,
            two: 0
        };

        info.grades.forEach(grade => {
            switch (grade) {
                case '5':
                    gradeCount.five++;
                    break;
                case '4':
                    gradeCount.four++;
                    break;
                case '3':
                    gradeCount.three++;
                    break;
                case '2':
                    gradeCount.two++;
                    break;
            }
        });

        const studentsCount = +info.students.length;

        const procUsp = Math.round((100 / studentsCount) * (studentsCount - gradeCount.two));
        const procKach = Math.round((100 / studentsCount) * (studentsCount - gradeCount.two - gradeCount.three));

        const result = template
            .replace(/\$group\$/g, info.group)
            .replace(/\$codeSpec\$/g, info.codeSpec)
            .replace(/\$specGroup\$/g, info.spec)
            .replace(/\$pModule\$/g, info.pm)
            .replace(/\$course\$/g, info.cource)
            .replace(/\$startDate\$/g, info.begin)
            .replace(/\$endDate\$/g, info.end)
            .replace(/\$leader\$/g, info.leader)
            .replace(/\$hours\$/g, info.hours)
            .replace(/\$studentsCount\$/g, studentsCount)
            .replace(/\$five\$/g, gradeCount.five)
            .replace(/\$four\$/g, gradeCount.four)
            .replace(/\$three\$/g, gradeCount.three)
            .replace(/\$two\$/g, gradeCount.two)
            .replace(/\$procUsp\$/g, procUsp)
            .replace(/\$procKach\$/g, procKach)

        resolve(result);
    });
}

/**
 * Проверяет наличие всех необходимых полей в объекте после парсера
 * @param inputValues
 * @returns {Promise<unknown>}
 */
function validator(inputValues){
    return new Promise((resolve, reject) => {
        const property = ['group', 'codeSpec', 'spec', 'cource',
            'hours', 'pm', 'begin', 'end', 'leader', 'leadPosition'];

        if((!inputValues.pk.length || !inputValues.students.length || !inputValues.grades.length) || (inputValues.students.length !== inputValues.grades.length)) {
            reject(new Error('Не корректно заполнен шаблон'));
        }

        for(const prop of property){
            if(!(prop in inputValues)){
                reject(new Error('Не корректно заполнен шаблон'));
            }
        }
        resolve();
    });
}