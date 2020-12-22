const axios = require('axios');

module.exports.openItPark = () => {
    return new Promise(resolve=>{
        axios.get('http://192.168.200.101/gpio/2')
            .then((response) => {
                resolve('Успешно!');
            }).catch(err=>{
                resolve('Ошибка');
            });

        /*  rp('http://192.168.200.101/gpio/2').then(html=>{
            resolve('Успешно!');
        }).catch(err=>{
            resolve('Ошибка');
        });*/
    });
};

module.exports.openMasterskie = () => {
    return new Promise(resolve=>{
        axios.get('http://192.168.7.101/gpio/2')
            .then((response) => {
                resolve('Успешно!');
            }).catch(err=>{
            resolve('Ошибка');
        });
    });
};