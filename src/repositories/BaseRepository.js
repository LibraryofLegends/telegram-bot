/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/repositories/BaseRepository.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Basisklasse für sämtliche Repository-Klassen.
 *
 * Diese Klasse stellt die grundlegenden Funktionen für den
 * Datenbankzugriff bereit und dient als gemeinsame Grundlage
 * aller Repositorys innerhalb von Library Of Legends.
 *
 * Funktionen:
 * - Datenbankzugriff
 * - Prepared Statements
 * - SQL-Validierung
 * - Fehlerbehandlung
 * - Query Logging
 * - CRUD-Grundfunktionen
 * - Query Builder
 * - Pagination
 * - Filter
 * - Sortierung
 * - Bulk-Operationen
 * - Transaktionen
 * - Soft Deletes
 * - Statistiken
 *
 * Verwendet von:
 * - MovieRepository
 * - SeriesRepository
 * - PersonRepository
 * - CollectionRepository
 * - GenreRepository
 * - StudioRepository
 * - CompanyRepository
 * - UserRepository
 * - WorkflowRepository
 * - AIRepository
 * - sowie allen zukünftigen Repository-Klassen
 *
 * Abhängigkeiten:
 * - src/config/database.js
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const db = require('../config/database');

class BaseRepository {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(tableName, primaryKey = 'id') {

        if (!tableName) {
            throw new Error('Repository benötigt einen Tabellennamen.');
        }

        this.db = db;

        this.table = tableName;

        this.primaryKey = primaryKey;

        this.softDeleteColumn = 'deleted_at';

        this.createdColumn = 'created_at';

        this.updatedColumn = 'updated_at';

        this.enableSoftDelete = false;

        this.enableLogging = true;

    }

    /**
     * ============================================================
     * Datenbank
     * ============================================================
     */

    /**
     * Datenbankinstanz zurückgeben
     */
    getDatabase() {

        return this.db;

    }

    /**
     * Tabellennamen zurückgeben
     */
    getTable() {

        return this.table;

    }

    /**
     * Primärschlüssel zurückgeben
     */
    getPrimaryKey() {

        return this.primaryKey;

    }

    /**
     * Prepared Statement erzeugen
     *
     * @param {string} sql
     * @returns {Statement}
     */
    prepare(sql) {

        this.log(sql);

        return this.db.prepare(sql);

    }

    /**
     * SQL ausführen (INSERT / UPDATE / DELETE)
     *
     * @param {string} sql
     * @param {Array} params
     * @returns {*}
     */
    execute(sql, params = []) {

        try {

            this.log(sql, params);

            return this.db.prepare(sql).run(params);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * Einzelnen Datensatz laden
     *
     * @param {string} sql
     * @param {Array} params
     * @returns {*}
     */
    get(sql, params = []) {

        try {

            this.log(sql, params);

            return this.db.prepare(sql).get(params);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * Mehrere Datensätze laden
     *
     * @param {string} sql
     * @param {Array} params
     * @returns {Array}
     */
    all(sql, params = []) {

        try {

            this.log(sql, params);

            return this.db.prepare(sql).all(params);

        } catch (error) {

            this.handleError(error);

        }

    }
    
        /**
     * ============================================================
     * Validierung
     * ============================================================
     */

    /**
     * Aktuellen Zeitstempel erzeugen
     *
     * @returns {string}
     */
    now() {

        return new Date().toISOString();

    }

    /**
     * SQL-Identifier validieren
     *
     * Erlaubt ausschließlich:
     * - Buchstaben
     * - Zahlen
     * - Unterstriche
     *
     * @param {string} identifier
     * @returns {string}
     */
    validateIdentifier(identifier) {

        const regex = /^[A-Za-z_][A-Za-z0-9_]*$/;

        if (!regex.test(identifier)) {

            throw new Error(
                `Ungültiger SQL-Identifier: ${identifier}`
            );

        }

        return identifier;

    }

    /**
     * Tabellennamen validieren
     *
     * @returns {string}
     */
    validateTable() {

        return this.validateIdentifier(this.table);

    }

    /**
     * Spaltennamen validieren
     *
     * @param {string} column
     * @returns {string}
     */
    validateColumn(column) {

        return this.validateIdentifier(column);

    }

    /**
     * Array validieren
     *
     * @param {*} value
     * @param {string} field
     */
    validateArray(value, field = 'Array') {

        if (!Array.isArray(value)) {

            throw new Error(
                `${field} muss ein Array sein.`
            );

        }

    }

    /**
     * Objekt validieren
     *
     * @param {*} value
     * @param {string} field
     */
    validateObject(value, field = 'Objekt') {

        if (typeof value !== 'object') {

            throw new Error(
                `${field} muss ein Objekt sein.`
            );

        }

        if (value === null) {

            throw new Error(
                `${field} darf nicht null sein.`
            );

        }

    }

    /**
     * String validieren
     *
     * @param {*} value
     * @param {string} field
     */
    validateString(value, field = 'String') {

        if (typeof value !== 'string') {

            throw new Error(
                `${field} muss ein String sein.`
            );

        }

        if (!value.trim()) {

            throw new Error(
                `${field} darf nicht leer sein.`
            );

        }

    }

    /**
     * Zahl validieren
     *
     * @param {*} value
     * @param {string} field
     */
    validateNumber(value, field = 'Zahl') {

        if (typeof value !== 'number') {

            throw new Error(
                `${field} muss eine Zahl sein.`
            );

        }

        if (Number.isNaN(value)) {

            throw new Error(
                `${field} enthält keine gültige Zahl.`
            );

        }

    }

    /**
     * ID validieren
     *
     * @param {*} id
     * @returns {*}
     */
    validateId(id) {

        if (id === undefined || id === null) {

            throw new Error(
                'ID fehlt.'
            );

        }

        return id;

    }
    
        /**
     * ============================================================
     * Logging
     * ============================================================
     */

    /**
     * Query-Logging aktivieren
     */
    enableQueryLogging() {

        this.enableLogging = true;

    }

    /**
     * Query-Logging deaktivieren
     */
    disableQueryLogging() {

        this.enableLogging = false;

    }

    /**
     * SQL-Abfrage protokollieren
     *
     * @param {string} sql
     * @param {Array} params
     */
    log(sql, params = []) {

        if (!this.enableLogging) {

            return;

        }

        console.log('================================================');
        console.log('[BaseRepository]');
        console.log('Tabelle   :', this.table);
        console.log('Zeit      :', this.now());
        console.log('SQL       :', sql);

        if (params.length > 0) {

            console.log('Parameter :', params);

        }

        console.log('================================================');

    }

    /**
     * Fehler zentral behandeln
     *
     * @param {Error} error
     */
    handleError(error) {

        console.error('================================================');
        console.error('[Repository Error]');
        console.error('Tabelle :', this.table);
        console.error('Zeit    :', this.now());
        console.error(error);
        console.error('================================================');

        throw error;

    }
    
        /**
     * Datensatz anhand der ID laden
     *
     * @param {*} id
     * @returns {*}
     */
    findById(id) {

        this.validateId(id);

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${this.validateColumn(this.primaryKey)} = ?
            LIMIT 1
        `;

        return this.get(sql, [id]);

    }

    /**
     * Ersten Datensatz anhand einer Spalte laden
     *
     * @param {string} column
     * @param {*} value
     * @returns {*}
     */
    findOne(column, value) {

        this.validateColumn(column);

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} = ?
            LIMIT 1
        `;

        return this.get(sql, [value]);

    }

    /**
     * Alle Datensätze laden
     *
     * @returns {Array}
     */
    findAll() {

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
        `;

        return this.all(sql);

    }

    /**
     * Ersten Datensatz laden
     *
     * @returns {*}
     */
    first() {

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            ORDER BY ${this.primaryKey} ASC
            LIMIT 1
        `;

        return this.get(sql);

    }

    /**
     * Letzten Datensatz laden
     *
     * @returns {*}
     */
    last() {

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            ORDER BY ${this.primaryKey} DESC
            LIMIT 1
        `;

        return this.get(sql);

    }

    /**
     * Prüfen ob Datensatz existiert
     *
     * @param {*} id
     * @returns {boolean}
     */
    exists(id) {

        this.validateId(id);

        const sql = `
            SELECT EXISTS(
                SELECT 1
                FROM ${this.validateTable()}
                WHERE ${this.primaryKey} = ?
            ) AS existsRecord
        `;

        const result = this.get(sql, [id]);

        return Boolean(result.existsRecord);

    }

    /**
     * Anzahl aller Datensätze ermitteln
     *
     * @returns {number}
     */
    count() {

        const sql = `
            SELECT COUNT(*) AS total
            FROM ${this.validateTable()}
        `;

        const result = this.get(sql);

        return result.total;

    }
    
        /**
     * Datensatz erstellen
     *
     * @param {Object} data
     * @returns {*}
     */
    create(data) {

        this.validateObject(data);

        const keys = Object.keys(data);

        if (keys.length === 0) {

            throw new Error(
                'Keine Daten zum Speichern vorhanden.'
            );

        }

        keys.forEach(column => this.validateColumn(column));

        const columns = keys.join(', ');

        const placeholders = keys.map(() => '?').join(', ');

        const values = Object.values(data);

        const sql = `
            INSERT INTO ${this.validateTable()}
            (${columns})
            VALUES
            (${placeholders})
        `;

        return this.execute(sql, values);

    }

    /**
     * Datensatz aktualisieren
     *
     * @param {*} id
     * @param {Object} data
     * @returns {*}
     */
    update(id, data) {

        this.validateId(id);

        this.validateObject(data);

        const keys = Object.keys(data);

        if (keys.length === 0) {

            throw new Error(
                'Keine Daten zum Aktualisieren vorhanden.'
            );

        }

        const values = [];

        const updates = [];

        for (const key of keys) {

            this.validateColumn(key);

            updates.push(`${key} = ?`);

            values.push(data[key]);

        }

        values.push(id);

        const sql = `
            UPDATE ${this.validateTable()}
            SET
                ${updates.join(', ')}
            WHERE
                ${this.primaryKey} = ?
        `;

        return this.execute(sql, values);

    }

    /**
     * Datensatz löschen
     *
     * @param {*} id
     * @returns {*}
     */
    delete(id) {

        this.validateId(id);

        const sql = `
            DELETE
            FROM ${this.validateTable()}
            WHERE ${this.primaryKey} = ?
        `;

        return this.execute(sql, [id]);

    }

    /**
     * Datensatz speichern
     *
     * Existiert der Datensatz bereits,
     * wird ein UPDATE ausgeführt,
     * andernfalls ein INSERT.
     *
     * @param {*} id
     * @param {Object} data
     * @returns {*}
     */
    save(id, data) {

        if (this.exists(id)) {

            return this.update(id, data);

        }

        return this.create(data);

    }
    
        /**
     * ============================================================
     * Query Builder
     * ============================================================
     */

    /**
     * Datensätze anhand einer Spalte laden
     *
     * @param {string} column
     * @param {*} value
     * @returns {Array}
     */
    findBy(column, value) {

        this.validateColumn(column);

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} = ?
        `;

        return this.all(sql, [value]);

    }

    /**
     * Datensätze anhand mehrerer Bedingungen laden
     *
     * @param {Object} filters
     * @returns {Array}
     */
    where(filters = {}) {

        this.validateObject(filters);

        const keys = Object.keys(filters);

        if (keys.length === 0) {

            return this.findAll();

        }

        const conditions = [];

        const values = [];

        for (const key of keys) {

            this.validateColumn(key);

            conditions.push(`${key} = ?`);

            values.push(filters[key]);

        }

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE
                ${conditions.join(' AND ')}
        `;

        return this.all(sql, values);

    }

    /**
     * WHERE IN
     *
     * @param {string} column
     * @param {Array} values
     * @returns {Array}
     */
    whereIn(column, values) {

        this.validateColumn(column);

        this.validateArray(values);

        if (values.length === 0) {

            return [];

        }

        const placeholders = values
            .map(() => '?')
            .join(', ');

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} IN (${placeholders})
        `;

        return this.all(sql, values);

    }

    /**
     * WHERE NOT IN
     *
     * @param {string} column
     * @param {Array} values
     * @returns {Array}
     */
    whereNotIn(column, values) {

        this.validateColumn(column);

        this.validateArray(values);

        if (values.length === 0) {

            return this.findAll();

        }

        const placeholders = values
            .map(() => '?')
            .join(', ');

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} NOT IN (${placeholders})
        `;

        return this.all(sql, values);

    }

    /**
     * WHERE IS NULL
     *
     * @param {string} column
     * @returns {Array}
     */
    whereNull(column) {

        this.validateColumn(column);

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} IS NULL
        `;

        return this.all(sql);

    }

    /**
     * WHERE IS NOT NULL
     *
     * @param {string} column
     * @returns {Array}
     */
    whereNotNull(column) {

        this.validateColumn(column);

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} IS NOT NULL
        `;

        return this.all(sql);

    }
    
        /**
     * Sortierung
     *
     * @param {string} column
     * @param {string} direction
     * @returns {Array}
     */
    orderBy(column, direction = 'ASC') {

        this.validateColumn(column);

        direction = direction.toUpperCase();

        if (!['ASC', 'DESC'].includes(direction)) {

            throw new Error(
                'Ungültige Sortierrichtung.'
            );

        }

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            ORDER BY ${column} ${direction}
        `;

        return this.all(sql);

    }

    /**
     * Anzahl der Datensätze begrenzen
     *
     * @param {number} limit
     * @returns {Array}
     */
    limit(limit = 10) {

        this.validateNumber(limit, 'Limit');

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            LIMIT ?
        `;

        return this.all(sql, [limit]);

    }

    /**
     * Offset
     *
     * @param {number} offset
     * @param {number} limit
     * @returns {Array}
     */
    offset(offset = 0, limit = 25) {

        this.validateNumber(offset, 'Offset');

        this.validateNumber(limit, 'Limit');

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            LIMIT ?
            OFFSET ?
        `;

        return this.all(sql, [limit, offset]);

    }

    /**
     * Pagination
     *
     * @param {number} page
     * @param {number} perPage
     * @returns {Object}
     */
    paginate(page = 1, perPage = 25) {

        this.validateNumber(page, 'Seite');

        this.validateNumber(perPage, 'Einträge');

        page = Math.max(page, 1);

        perPage = Math.max(perPage, 1);

        const offset = (page - 1) * perPage;

        const total = this.count();

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            LIMIT ?
            OFFSET ?
        `;

        return {

            page,

            perPage,

            total,

            pages: Math.ceil(total / perPage),

            data: this.all(sql, [perPage, offset])

        };

    }

    /**
     * Suche über LIKE
     *
     * @param {string} column
     * @param {string} searchTerm
     * @returns {Array}
     */
    search(column, searchTerm) {

        this.validateColumn(column);

        this.validateString(searchTerm, 'Suchbegriff');

        const sql = `
            SELECT *
            FROM ${this.validateTable()}
            WHERE ${column} LIKE ?
        `;

        return this.all(sql, [`%${searchTerm}%`]);

    }

    /**
     * DISTINCT-Werte
     *
     * @param {string} column
     * @returns {Array}
     */
    distinct(column) {

        this.validateColumn(column);

        const sql = `
            SELECT DISTINCT ${column}
            FROM ${this.validateTable()}
        `;

        return this.all(sql);

    }

    /**
     * Einzelnen Wert zurückgeben
     *
     * @param {string} column
     * @returns {*}
     */
    value(column) {

        this.validateColumn(column);

        const sql = `
            SELECT ${column}
            FROM ${this.validateTable()}
            LIMIT 1
        `;

        const row = this.get(sql);

        return row ? row[column] : null;

    }

    /**
     * Komplette Spalte als Array zurückgeben
     *
     * @param {string} column
     * @returns {Array}
     */
    pluck(column) {

        this.validateColumn(column);

        const sql = `
            SELECT ${column}
            FROM ${this.validateTable()}
        `;

        const rows = this.all(sql);

        return rows.map(row => row[column]);

    }
    
        /**
     * ============================================================
     * Bulk-Operationen
     * ============================================================
     */

    /**
     * Mehrere Datensätze einfügen
     *
     * @param {Array} records
     * @returns {number}
     */
    insertMany(records) {

        this.validateArray(records);

        if (records.length === 0) {

            return 0;

        }

        const columns = Object.keys(records[0]);

        columns.forEach(column => this.validateColumn(column));

        const placeholders = `(${columns.map(() => '?').join(', ')})`;

        const sql = `
            INSERT INTO ${this.validateTable()}
            (${columns.join(', ')})
            VALUES ${placeholders}
        `;

        const statement = this.prepare(sql);

        const transaction = this.db.transaction((rows) => {

            for (const row of rows) {

                statement.run(Object.values(row));

            }

        });

        transaction(records);

        return records.length;

    }

    /**
     * Mehrere Datensätze löschen
     *
     * @param {Array} ids
     * @returns {*}
     */
    deleteMany(ids) {

        this.validateArray(ids);

        if (ids.length === 0) {

            return;

        }

        const placeholders = ids
            .map(() => '?')
            .join(', ');

        const sql = `
            DELETE
            FROM ${this.validateTable()}
            WHERE ${this.primaryKey}
            IN (${placeholders})
        `;

        return this.execute(sql, ids);

    }

    /**
     * Tabelle leeren
     *
     * @returns {*}
     */
    truncate() {

        const sql = `
            DELETE
            FROM ${this.validateTable()}
        `;

        return this.execute(sql);

    }

    /**
     * Datensatz ersetzen
     *
     * @param {Object} data
     * @returns {*}
     */
    replace(data) {

        this.validateObject(data);

        const keys = Object.keys(data);

        keys.forEach(column => this.validateColumn(column));

        const placeholders = keys
            .map(() => '?')
            .join(', ');

        const sql = `
            REPLACE INTO ${this.validateTable()}
            (${keys.join(', ')})
            VALUES (${placeholders})
        `;

        return this.execute(
            sql,
            Object.values(data)
        );

    }

    /**
     * Datensätze in Blöcken laden
     *
     * @param {number} size
     * @param {Function} callback
     */
    chunk(size = 100, callback) {

        this.validateNumber(size, 'Chunkgröße');

        let offset = 0;

        while (true) {

            const sql = `
                SELECT *
                FROM ${this.validateTable()}
                LIMIT ?
                OFFSET ?
            `;

            const rows = this.all(sql, [size, offset]);

            if (rows.length === 0) {

                break;

            }

            callback(rows);

            offset += size;

        }

    }

    /**
     * Alle Datensätze löschen
     *
     * Alias für truncate()
     *
     * @returns {*}
     */
    clear() {

        return this.truncate();

    }
    
        /**
     * ============================================================
     * Transaktionen
     * ============================================================
     */

    /**
     * Führt mehrere Datenbankoperationen
     * innerhalb einer Transaktion aus.
     *
     * @param {Function} callback
     * @returns {*}
     */
    transaction(callback) {

        if (typeof callback !== 'function') {

            throw new Error(
                'Es muss eine Callback-Funktion übergeben werden.'
            );

        }

        const transaction = this.db.transaction(() => {

            return callback(this);

        });

        return transaction();

    }

    /**
     * Transaktion starten
     *
     * @returns {*}
     */
    beginTransaction() {

        return this.db.exec('BEGIN TRANSACTION');

    }

    /**
     * Transaktion bestätigen
     *
     * @returns {*}
     */
    commit() {

        return this.db.exec('COMMIT');

    }

    /**
     * Transaktion zurückrollen
     *
     * @returns {*}
     */
    rollback() {

        return this.db.exec('ROLLBACK');

    }

    /**
     * Mehrere SQL-Befehle
     * innerhalb einer Transaktion ausführen.
     *
     * @param {Array} statements
     * @returns {number}
     */
    executeMany(statements) {

        this.validateArray(statements);

        if (statements.length === 0) {

            return 0;

        }

        const transaction = this.db.transaction((queries) => {

            for (const query of queries) {

                if (!query.sql) {

                    throw new Error(
                        'SQL-Anweisung fehlt.'
                    );

                }

                const params = query.params || [];

                this.db
                    .prepare(query.sql)
                    .run(params);

            }

        });

        transaction(statements);

        return statements.length;

    }

    /**
     * SQL direkt ausführen
     *
     * @param {string} sql
     * @returns {*}
     */
    exec(sql) {

        this.validateString(sql, 'SQL');

        return this.db.exec(sql);

    }

    /**
     * Datenbank optimieren
     *
     * @returns {*}
     */
    vacuum() {

        return this.db.exec('VACUUM');

    }

    /**
     * WAL-Checkpoint durchführen
     *
     * @returns {*}
     */
    checkpoint() {

        return this.db.pragma('wal_checkpoint(FULL)');

    }