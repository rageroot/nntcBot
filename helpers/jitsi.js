const child_process = require('child_process');

/**
 * выводит список текущих конференций
 * @returns {Promise<unknown>}
 */
module.exports.health = () => {
    return new Promise( resolve=>{
	const cmd = '/usr/bin/ssh -i /home/ebot/.ssh/id_rsa administrator@192.168.10.187 -tt /srv/nntc/jitsi/jitsi-status.sh';
	try {
		const result = JSON.parse(child_process.execSync(cmd));
		//console.log(result);
		const baseDomain = 'https://online.nntc.nnov.ru';
		const blackList = [
			'org.jitsi.jicofo.health'
		];
		let confs = [];
		let confNumber = 0;
		result.forEach(l1=>{
			//console.log('l1', l1);
			if(l1.length){
				l1.forEach(l2=>{
					//console.log('l2', l2);
					if(l2.length){
						l2.forEach(l3=>{
							//console.log('l3', l3);
							let writeEnable = true;
							let roomName = l3.roomname;
							blackList.forEach(blItem=>{
								if(writeEnable){
									writeEnable = !(blItem===roomName.substr(0,blItem.length));
								}
							});

							if(writeEnable){
								confNumber++;
								confs.push(
									  confNumber + ". " + [baseDomain, l3.roomname].join('/') + " — " + l3.NBparticipant
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

/*
[
	[
		[
			{
				object
			}
		]
	],
	[
		[
			{
				object
			}
		]
	],
]
*/
/*
* #!/bin/bash

# set -x
# exec &> >(tee -a "/tmp/jitsi-status-log.txt")

JITSI_DIR="/srv/nntc/jitsi/"

MUC_DOMAIN="muc.meet.jitsi"
STATUS_URL="http://127.0.0.1:5280/status?domain=${MUC_DOMAIN}"

main() {
    cd "$JITSI_DIR"
    docker-compose exec prosody wget --quiet -O- "$STATUS_URL"
}


main $*

* */
