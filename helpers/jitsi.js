const rp = require('request-promise');
const child_process = require('child_process');

module.exports.health = () => {
    return new Promise( resolve=>{
	const cmd = '/usr/bin/ssh -i /home/ebot/.ssh/id_rsa administrator@192.168.10.187 -tt /srv/nntc/jitsi/jitsi-status.sh';
	try {
		const result = JSON.parse(child_process.execSync(cmd));
		const baseDomain = 'https://online.nntc.nnov.ru';
		const blackList = [
			'org.jitsi.jicofo.health'
		];
		let confs = [];
		result.forEach(l1=>{
			//console.log('l1', l1);
			if(l1.length){
				l1.forEach(l2=>{
					//console.log('l2', l2);
					if(l2.length){
						l2.forEach(l3=>{

							let writeEnable = true;
							let roomName = l3.roomname;
							blackList.forEach(blItem=>{
								if(writeEnable){
									writeEnable = !(blItem===roomName.substr(0,blItem.length));
								}
							});

							if(writeEnable){
								confs.push(
									[baseDomain, l3.roomname].join('/')
								);
							}
						});
					}
				});
			}

		});
		let responseMessage;
		if(!confs.length){
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
