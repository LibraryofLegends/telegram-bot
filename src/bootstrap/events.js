'use strict';

module.exports = async function (container) {

    const logger = container.resolve('logger');

    logger.info('Registriere Events ...');

    const registry = container.resolve('eventRegistry');

    registry.initialize();

};