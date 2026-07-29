'use strict';

module.exports = async function (container) {

    const scheduler = container.resolve('scheduler');

    if (typeof scheduler.start === 'function') {
        await scheduler.start();
    }

};