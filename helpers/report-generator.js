const strings = require("../resources/strings");
const config = require("../resources/config");
const child_process = require('child_process');
const fs = require('fs').promises;

module.exports.manual = function(){
    return strings.textConstants.REPORTS_GENERATE_MANUAL_FILE;
}

module.exports.template = function(){
    return strings.textConstants.REPORTS_GENERATE_TEMPLATE_TXT;
}

module.exports.generate = function(userId, tfr){
    return new Promise(async (resolve, reject) => {
        const tmpFolderPath = `tmp/${userId}_reports`;

        try{
            await fs.mkdir(tmpFolderPath);
            const initialDataFile = await downloadFile(tfr.file_path, tmpFolderPath);
        }catch (err) {
            reject(err);
        }

    })
}

function downloadFile(filePathOnTelegramServer, folderOnLocal){
    return new Promise((resolve, reject) => {
        const botToken = config.TG_TOKEN;
//axios
    });
}
