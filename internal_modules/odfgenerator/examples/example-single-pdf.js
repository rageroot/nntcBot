'use strict';
const exampleApp = require('../index');
const path = require('path');

const params = {
    PDFDir: path.join(__dirname, 'PDF'),
    ODTDir: path.join(__dirname, 'ODT'),
    clearWorkingDir: false,
    createPDF: true,
    removeODT: true
}

console.log('single example start: will create only PDF-file and NOT clear working dir');

let workingDir = path.join(__dirname, 'tmp');
let template = path.join(__dirname, 'templates', 'example_tpl.odt');
let resultFileName = 'example_result.odt';

const people = {
    'man': 'Иван Иванович',
    'level': 'Первое место',
    'theme': 'Олимпиада по программированию 2020'
}

setTimeout(async ()=>{
    console.log('gen log: ', await exampleApp.gen(people, resultFileName, template, workingDir, params));
    console.log('single example finish');
});