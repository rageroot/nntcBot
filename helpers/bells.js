'use strict'
/**
 * Выводит информацию о текущем занятии и время до конца
 * @returns {Promise<unknown>}
 */
module.exports.info = () => {
	const dateNow = new Date();
	const currentHours = dateNow.getHours();
	let currentState = "";

	let markup = [
		'<b>1 пара:</b> 08:10 - 09:40',
		'<b>2 пара:</b> 09:50 - 11:20',
		'<b>3 пара:</b> 11:40 - 13:10',
		'<b>4 пара:</b> 13:20 - 14:50',
		'<b>5 пара:</b> 15:00 - 16:30',
		'<b>6 пара:</b> 16:40 - 18:10',
	];

	const markupTime = [		//точность до секунд не важна, используются минуты, прошедшие с начала суток
		{
			description: "1 пара",
			stopMinuts: 580,
		},
		{
			description: "1 перемена",
			stopMinuts: 590,
		},
		{
			description: "2 пара",
			stopMinuts: 680,
		},
		{
			description: "2 перемена",
			stopMinuts: 700,
		},
		{
			description: "3 пара",
			stopMinuts: 790,
		},
		{
			description: "3 перемена",
			stopMinuts: 800,
		},
		{
			description: "4 пара",
			stopMinuts: 890,
		},
		{
			description: "4 перемена",
			stopMinuts: 900,
		},
		{
			description: "5 пара",
			stopMinuts: 990,
		},
		{
			description: "5 перемена",
			stopMinuts: 1000,
		},
		{
			description: "6 пара",
			stopMinuts: 1090,
		},
	];

	const minutes = currentHours * 60 + dateNow.getMinutes(); //текущее количество минут с начала дня
	if((minutes < 490) || (minutes > 1090) && dateNow.getDay() != 0) {
		if(minutes < 490)
			currentState = "Еще слишком рано";
		else
			currentState = "Уже слишком поздно";
	}
	else{
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
							markup[i / 2] = `==> ${markup[i / 2]}`;
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
