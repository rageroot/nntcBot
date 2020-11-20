'use strict';

module.exports.getEgg = (userId, userName, name) => {
    switch (name) {
        case 'voice':
            return [
                userName,
                ', ',
                'Гав!',
            ].join('');
    }
};