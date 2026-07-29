'use strict';

module.exports = async function (container) {

    const logger = container.resolve('logger');

    logger.info('Initialisiere Engines ...');

    container.resolve('mediaEngine');

};