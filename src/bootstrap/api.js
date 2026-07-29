'use strict';

module.exports = async function (container) {

    const api = container.resolve('api');

    if (typeof api.start === 'function') {
        await api.start();
    }

};