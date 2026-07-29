/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/bootstrap/bootstrap.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentraler Bootstrap der Anwendung.
 *
 * Initialisiert sämtliche Komponenten in der richtigen Reihenfolge.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

module.exports = async function bootstrap(container) {

    const logger = container.resolve('logger');

    logger.info('==========================================');
    logger.info('Library Of Legends 2.0');
    logger.info('Bootstrap gestartet');
    logger.info('==========================================');

    await require('./database')(container);

    await require('./repositories')(container);

    await require('./services')(container);

    await require('./events')(container);

    await require('./engines')(container);

    await require('./scheduler')(container);

    await require('./telegram')(container);

    await require('./api')(container);

    logger.info('==========================================');
    logger.info('Bootstrap abgeschlossen');
    logger.info('==========================================');

};