'use strict';
const exec = require('child_process').exec;

function uncompress(file, dir){
    return new Promise(resolve => {
        const cmd = [
            '[', ' ', '-d', ' ', '\'', dir, '\'', ' ', ']', ' ', '&&', ' ', 'rm', ' ', '-r', ' ', dir, ';',
            'unzip', ' \'', file, '\' ', '-d', ' ', dir, ' ', '2>/dev/null',
        ].join('');
        exec(cmd, (error, stdout) => {
            if(error){
                console.log('Err?', error);
                resolve('error');
            }
            resolve('success');
        });
    });
}

function compress(dir, file){
    return new Promise(resolve => {
        const cmd = [
            'cd', ' ', dir, ';',
            'zip', ' ', '-r', ' \'', file, '\' ', '.', ' ', '2>/dev/null',
        ].join('');
        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function replace(file, search, replace){
    return new Promise(resolve => {
        const cmd = [
            'sed', ' ', '-i', ' ', '\'s/', search, '/', replace, '/g\'', ' ', file, ' ', '2>/dev/null',
        ].join('');

        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function convertToPDF(src, dst){
    //libreoffice --headless --convert-to pdf:writer_pdf_Export example_tpl.odt --outdir  ./
    return new Promise(resolve => {
        const cmd = [
            'libreoffice', ' ', '--headless', ' ', '--convert-to', ' ', 'pdf:writer_pdf_Export', ' \'', src, '\' ', '--outdir', ' \'', dst, '\' ', '2>/dev/null',
        ].join('');

        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function removeODT(file){
    return new Promise(resolve => {
        const cmd = [
            'rm', ' \'', file, '\' ', '2>/dev/null',
        ].join('');

        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function checkDirs(params){
    return new Promise(resolve => {
        const cmd = [
            '[', ' ', '-d', ' ', '\'', params.PDFDir, '\'', ' ', ']', ' ', '||', ' ', 'mkdir', ' ', params.PDFDir, ';',
            '[', ' ', '-d', ' ', '\'', params.ODTDir, '\'', ' ', ']', ' ', '||', ' ', 'mkdir', ' ', params.ODTDir, ' ', '2>/dev/null',
        ].join('');
        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function clear(workingDir){
    return new Promise(resolve => {
        const cmd = [
            'rm', ' ', '-r', ' ', workingDir, ' ', '2>/dev/null',
        ].join('');

        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success');
        });
    });
}

function pack(dir, file){
    return new Promise(resolve => {
        const cmd = [
            'cd', ' ', dir, ';',
            'zip', ' ', '-r', ' \'', file, '\' ', '.', ' ', '2>/dev/null',
        ].join('');
        exec(cmd, (error, stdout) => {
            if(error){
                resolve('error');
            }
            resolve('success (' + file + ')' );
        });
    });
}

// main function
exports.gen = (data, resultFileName, template, workingDir, params) => {
    const contentFile = [workingDir, 'content.xml'].join('/');
    let genLog = {};
    return new Promise(async resolve => {

        // stage 0 -- check and create dirs
        genLog['stage 0/3'] = await checkDirs(params, params);

        // stage 1 -- uncompressing
        genLog['stage 1/3'] = await uncompress(template, workingDir);

        // stage 2 -- replacement...
        for (const key in data) {
            const tplKey = ['{', key, '}'].join('');
            genLog['stage 2/3 key ' + tplKey] = await replace(contentFile, tplKey, data[key]);
        }

        // stage 3 -- compressing
        genLog['stage 3/3'] = await compress(workingDir, [params.ODTDir, resultFileName].join('/'));

        if (params.clearWorkingDir) {
            genLog['clear working dir'] = await clear(workingDir);
        }

        if (params.createPDF) {
            genLog['create PDF'] = await convertToPDF([params.ODTDir, resultFileName].join('/'), params.PDFDir);
            // if(params.zipPDFPackagePath){
            //     genLog['create zip PDF package'] = await pack(params.PDFDir, params.zipPDFPackagePath);
            // }
        }

        if (params.removeODT) {
            genLog['remove ODT'] = await removeODT([params.ODTDir, resultFileName].join('/'));
        } else {
            // if(params.zipODTPackagePath){
            //     genLog['create zip ODT package'] = await pack(params.ODTDir, params.zipODTPackagePath);
            // }
        }

        resolve(genLog);
    });
}