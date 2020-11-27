'use strict'
module.exports.info = () => {
	const dateNow = new Date();
	const currentHours = dateNow.getHours();
	let currentState = "";

	let markup = [
		'<b>1 пара:</b> 08:00 - 09:30',
		'<b>2 пара:</b> 09:40 - 11:10',
		'<b>3 пара:</b> 11:30 - 13:00',
		'<b>4 пара:</b> 13:10 - 14:40',
		'<b>5 пара:</b> 14:50 - 16:20',
		'<b>6 пара:</b> 16:30 - 18:00',
	];

	const markupTime = [		//точность до секунд не важна, используются минуты, прошедшие с начала суток
		{
			description: "1 пара",
			stopMinuts: 570,
		},
		{
			description: "1 перемена",
			stopMinuts: 580,
		},
		{
			description: "2 пара",
			stopMinuts: 670,
		},
		{
			description: "2 перемена",
			stopMinuts: 690,
		},
		{
			description: "3 пара",
			stopMinuts: 780,
		},
		{
			description: "3 перемена",
			stopMinuts: 790,
		},
		{
			description: "4 пара",
			stopMinuts: 880,
		},
		{
			description: "4 перемена",
			stopMinuts: 890,
		},
		{
			description: "5 пара",
			stopMinuts: 980,
		},
		{
			description: "5 перемена",
			stopMinuts: 990,
		},
		{
			description: "6 пара",
			stopMinuts: 1080,
		},
	];

	if((currentHours < 8) || (currentHours > 18)) {
		if(currentHours < 8)
			currentState = "Еще слишком рано";
		else
			currentState = "Уже слишком поздно";
	}
	else{
		const minutes = currentHours * 60 + dateNow.getMinutes(); //текущее количество минут с начала дня
		switch (dateNow.getDay()) { //смотрим на расписание, в зависимости от дня недели
			case 0:
				currentState = "Сегодня выходной";
				break;
			case 8:				//заглушка для субботы
				break;
			default:			//рабочая неделя
				for(let i = 0; i < markupTime.length; ++i){			//смотрим какое сейчас событие
					if(minutes - markupTime[i].stopMinuts < 0){
						currentState = `Сейчас ${markupTime[i].description}, до конца ${markupTime[i].stopMinuts - minutes} минут`;
						if(i % 2 == 0){
							markup[i / 2] = ` ==> ${markup[i / 2]}`;
						}
						break;
					}
				}
				break;
		}
	}
	markup.push(currentState);
	return new Promise( resolve=>{
		resolve(markup.join("\n"));
	});
};
