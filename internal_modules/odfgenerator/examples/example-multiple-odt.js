'use strict';
const exampleApp = require('../index');
const path = require('path');

const params = {
    PDFDir: path.join(__dirname, 'PDF'),
    ODTDir: path.join(__dirname, 'ODT'),
    clearWorkingDir: true,
    createPDF: false,
    removeODT: false
}

console.log('multiple example: will create only ODT files and clear working dir');

let template = path.join(__dirname, 'templates', 'example_tpl.odt');

const peoples = [
    {
        'man': 'Иван Иванович',
        'level': 'Первое место',
        'theme': 'Олимпиада по программированию 2020'
    },
    {
        'man': 'Пётр Иванович',
        'level': 'Второе место',
        'theme': 'Олимпиада по программированию 2020'
    },
    {
        'man': 'Иван Петрович',
        'level': 'Третье место',
        'theme': 'Олимпиада по программированию 2020'
    },
    {
        'man': 'Мария Ивановна',
        'level': '5 место',
        'theme': 'Олимпиада по программированию 2020'
    }
];

setTimeout(async ()=>{
    for (let i = 0; i < peoples.length; i++) {
        let people = peoples[i];
        let resultFileName = 'файл ' + people['man'] + '.odt';
        let workingDir = path.join( __dirname, [ 'tmp', '__', people['man'].replace(' ', '_') ].join('') );
        console.log('gen log: ', await exampleApp.gen(people, resultFileName, template, workingDir, params));
    }
    console.log('multiple example finish');
});