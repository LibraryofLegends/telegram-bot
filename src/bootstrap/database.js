/**
 * ========================================================================
 * Datenbank Bootstrap
 * ========================================================================
 */

'use strict';

module.exports = async function (container) {

    const logger = container.resolve('logger');

    logger.info('Initialisiere Datenbank ...');

    const database = container.resolve('database');

    if (typeof database.connect === 'function') {
        await database.connect();
    }

};