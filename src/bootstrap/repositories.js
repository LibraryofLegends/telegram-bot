'use strict';

module.exports = async function (container) {

    const logger = container.resolve('logger');

    logger.info('Initialisiere Repositories ...');

    container.resolve('repositories');

};