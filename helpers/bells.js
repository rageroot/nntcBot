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
			sopMinuts: 570,
		},
		{
			description: "1 перемена",
			sopMinuts: 580,
		},
		{
			description: "2 пара",
			sopMinuts: 670,
		},
		{
			description: "2 перемена",
			sopMinuts: 690,
		},
		{
			description: "3 пара",
			sopMinuts: 780,
		},
		{
			description: "3 перемена",
			sopMinuts: 790,
		},
		{
			description: "4 пара",
			sopMinuts: 880,
		},
		{
			description: "4 перемена",
			sopMinuts: 890,
		},
		{
			description: "5 пара",
			sopMinuts: 980,
		},
		{
			description: "5 перемена",
			sopMinuts: 990,
		},
		{
			description: "6 пара",
			sopMinuts: 1080,
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
					if(minutes - markupTime[i].sopMinuts < 0){
						currentState = `Сейчас ${markupTime[i].description}, до конца ${markupTime[i].sopMinuts - minutes} минут`;
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
//getDay - номер дня недели
//getHours()- часы по нашему времени


/*
const dateNow = new Date();
const currentHours = dateNow.getHours();
let currentState = "";
let markup = [
	'<b>1 пара:</b> 08:00 - 09:30\n',
	'<b>2 пара:</b> 09:40 - 11:10\n',
	'<b>3 пара:</b> 11:30 - 13:00\n',
	'<b>4 пара:</b> 13:10 - 14:40\n',
	'<b>5 пара:</b> 14:50 - 16:20\n',
	'<b>6 пара:</b> 16:30 - 18:00\n',
];
const markupTime = [		//точность до секунд не важна, используются минуты, прошедшие с начала суток
	{
		description: "1 пара",
		sopMinuts: 570,
	},
	{
		description: "1 перемена",
		sopMinuts: 580,
	},
	{
		description: "2 пара",
		sopMinuts: 670,
	},
	{
		description: "2 перемена",
		sopMinuts: 690,
	},
	{
		description: "3 пара",
		sopMinuts: 780,
	},
	{
		description: "3 перемена",
		sopMinuts: 790,
	},
	{
		description: "4 пара",
		sopMinuts: 880,
	},
	{
		description: "4 перемена",
		sopMinuts: 890,
	},
	{
		description: "5 пара",
		sopMinuts: 980,
	},
	{
		description: "5 перемена",
		sopMinuts: 990,
	},
	{
		description: "6 пара",
		sopMinuts: 1080,
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
		case 6:				//для субботы
			break;
		default:			//рабочая неделя
			for(let i = 0; i < markupTime.length; ++i){			//смотрим какое сейчас событие
				if(minutes - markupTime[i].sopMinuts < 0){
					currentState = `Сейчас ${markupTime[i].description}, до конца ${markupTime[i].sopMinuts - minutes} минут`;
					if(i % 2 == 0){
						markup[i / 2] = `<span style="color: #ff0000;">${markup[i / 2]}</span>`;
					}
					break;
				}
			}
			break;
	}
}
markup.push(currentState);
console.log(markup.join());*/