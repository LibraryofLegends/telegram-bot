'use strict';

module.exports = async function (container) {

    const telegram = container.resolve('telegram');

    if (typeof telegram.connect === 'function') {
        await telegram.connect();
    }

};