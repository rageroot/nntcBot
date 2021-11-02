const child_process = require('child_process');

const cmd = '/usr/bin/ssh -i /home/ebot/.ssh/id_rsa administrator@192.168.10.187 -tt /srv/nntc/jitsi/jitsi-status.sh';
const baseDomain = 'https://online.nntc.nnov.ru';
const blackList = [
    'org.jitsi.jicofo.health'
];

/**
 * выводит список текущих конференций
 * @returns {Promise<unknown>}
 */
module.exports.health = () => {
    return new Promise(resolve => {
        try {
            let confs = [];
            let confNumber = 0;
            const result = JSON.parse(child_process.execSync(cmd));
            result.forEach(l1 => {
                if (l1.length) {
                    l1.forEach(l2 => {
                        if (l2.length) {
                            l2.forEach(l3 => {
                                let writeEnable = true;
                                let roomName = l3.roomname;
                                blackList.forEach(blItem => {
                                    if (writeEnable) {
                                        writeEnable = ! (blItem === roomName.substr(0, blItem.length));
                                    }
                                });

                                if (writeEnable) {
                                    confNumber++;
                                    conference = confNumber + ". " + [baseDomain, l3.roomname].join('/') + " — " + l3.NBparticipant;
                                    l3.participant.forEach( participant => {
                                        conference += "\n    " + participant.display_name;
                                        if (participant.audiomuted) {
                                            confenrence += " 🔇";
                                        } else {
                                            confenrence += " 🔊";
                                        }

                                        if (participant.videomuted) {
                                            conference += " 📷";
                                        } else {
                                            conference += " 📸";
                                        }
                                    });
                                    confs.push(conference);
                                }
                            });
                        }
                    });
                }
            });
            let responseMessage;
            if (! confs.length) {
                responseMessage = 'конференции пока не идут';
            } else {
                responseMessage = 'сейчас идут конференции:\n' + confs.join('\n');
            }
            resolve(responseMessage);
        } catch(e) {
            resolve('Ошибка: ' + JSON.stringify(e));
        }
    });
};
