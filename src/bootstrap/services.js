'use strict';

module.exports = async function (container) {

    const logger = container.resolve('logger');

    logger.info('Initialisiere Services ...');

    container.resolve('serviceManager');

};