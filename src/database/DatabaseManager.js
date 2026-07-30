/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/DatabaseManager.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Verwaltung der SQLite-Datenbank.
 *
 * Stellt sämtliche Datenbankfunktionen für das gesamte
 * System bereit.
 *
 * Funktionen:
 * - Datenbankzugriff
 * - Prepared Statements
 * - SQL-Ausführung
 * - Transaktionen
 * - WAL-Checkpoint
 * - VACUUM
 * - Integritätsprüfung
 * - Logging
 * - Informationen
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class DatabaseManager {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(database, logger = null) {

        if (!database) {

            throw new Error(
                'DatabaseManager benötigt eine Datenbankinstanz.'
            );

        }

        this.database = database;

        this.logger = logger;

    }

    /**
     * ============================================================
     * Datenbank
     * ============================================================
     */

    getDatabase() {

        return this.database;

    }

    /**
     * ============================================================
     * Logging
     * ============================================================
     */

    log(level, message) {

        if (!this.logger) {

            return;

        }

        if (typeof this.logger[level] === 'function') {

            this.logger[level](message);

        }

    }

    /**
     * ============================================================
     * Statements
     * ============================================================
     */

    prepare(sql) {

        this.log('debug', `[Database] PREPARE ${sql}`);

        return this.database.prepare(sql);

    }

    exec(sql) {

        this.log('debug', `[Database] EXEC ${sql}`);

        return this.database.exec(sql);

    }

    pragma(command) {

        this.log('debug', `[Database] PRAGMA ${command}`);

        return this.database.pragma(command);

    }

    /**
     * ============================================================
     * CRUD-Helfer
     * ============================================================
     */

    run(sql, params = []) {

        this.log('debug', `[Database] RUN ${sql}`);

        return this
            .prepare(sql)
            .run(params);

    }

    get(sql, params = []) {

        this.log('debug', `[Database] GET ${sql}`);

        return this
            .prepare(sql)
            .get(params);

    }

    all(sql, params = []) {

        this.log('debug', `[Database] ALL ${sql}`);

        return this
            .prepare(sql)
            .all(params);

    }

    /**
     * ============================================================
     * Transaktionen
     * ============================================================
     */

    transaction(callback) {

        if (typeof callback !== 'function') {

            throw new Error(
                'Ungültige Transaktion.'
            );

        }

        return this.database.transaction(callback);

    }

    begin() {

        return this.exec(
            'BEGIN TRANSACTION'
        );

    }

    commit() {

        return this.exec(
            'COMMIT'
        );

    }

    rollback() {

        return this.exec(
            'ROLLBACK'
        );

    }

    /**
     * ============================================================
     * Optimierung
     * ============================================================
     */

    vacuum() {

        return this.exec(
            'VACUUM'
        );

    }

    analyze() {

        return this.exec(
            'ANALYZE'
        );

    }

    optimize() {

        return this.pragma(
            'optimize'
        );

    }

    checkpoint() {

        return this.pragma(
            'wal_checkpoint(FULL)'
        );

    }

    /**
     * ============================================================
     * Integrität
     * ============================================================
     */

    integrityCheck() {

        return this.pragma(
            'integrity_check'
        );

    }

    foreignKeys(enable = true) {

        return this.pragma(

            `foreign_keys = ${enable ? 'ON' : 'OFF'}`

        );

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    version() {

        return this.get(

            'SELECT sqlite_version() AS version'

        )?.version;

    }

    tables() {

        return this.all(`
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        `);

    }

    tableExists(table) {

        return Boolean(

            this.get(

                `
                SELECT name
                FROM sqlite_master
                WHERE type='table'
                AND name=?
                `,

                [table]

            )

        );

    }

    /**
     * ============================================================
     * Verbindung
     * ============================================================
     */

    close() {

        this.log(
            'info',
            'SQLite-Verbindung wird geschlossen.'
        );

        return this.database.close();

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            version: this.version(),

            tables: this.tables(),

            connected: !!this.database

        };

    }

    /**
     * ============================================================
     * JSON
     * ============================================================
     */

    toJSON() {

        return this.info();

    }

}

module.exports = DatabaseManager;