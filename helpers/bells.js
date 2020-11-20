// const rp = require('request-promise');
// const child_process = require('child_process');

module.exports.info = () => {

    const markup = [
	'<b>1 пара:</b> 08:00 - 09:30',
	'<b>2 пара:</b> 09:40 - 11:10',
	'<b>3 пара:</b> 11:30 - 13:00',
	'<b>4 пара:</b> 13:10 - 14:40',
	'<b>5 пара:</b> 14:50 - 16:20',
	'<b>6 пара:</b> 16:30 - 18:00',
	].join('\n');

    return new Promise( resolve=>{
	resolve(markup);
    });
};
