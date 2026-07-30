/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/repositories/BaseRepository.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Enterprise Base Repository
 *
 * Diese Klasse dient als zentrale Basisklasse sämtlicher Repositorys.
 * Alle Repositorys der Anwendung erben von dieser Klasse und erhalten
 * dadurch eine einheitliche API für Datenbankoperationen.
 *
 * Features
 * --------
 * ✓ CRUD
 * ✓ Fluent Query Builder
 * ✓ Prepared Statements
 * ✓ Validierung
 * ✓ Bulk Operationen
 * ✓ Transaktionen
 * ✓ Soft Deletes
 * ✓ Statistiken
 * ✓ Query Logging
 * ✓ Erweiterbare Architektur
 *
 * Version:
 * 2.0.0
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

            throw new Error(
                'Repository benötigt einen Tabellennamen.'
            );

        }

        /**
         * Datenbank
         */

        this.db = db;

        /**
         * Tabelleninformationen
         */

        this.table = tableName;

        this.primaryKey = primaryKey;

        /**
         * Standardspalten
         */

        this.createdColumn = 'created_at';

        this.updatedColumn = 'updated_at';

        this.softDeleteColumn = 'deleted_at';

        /**
         * Optionen
         */

        this.enableLogging = true;

        this.enableSoftDelete = false;

        /**
         * Query Builder Status
         */

        this.resetQueryState();

    }

    /**
     * ============================================================
     * Query State
     * ============================================================
     */

    /**
     * Initialisiert den internen Query Builder.
     *
     * Diese Methode wird sowohl im Konstruktor als auch bei
     * query() verwendet.
     *
     * @returns {BaseRepository}
     */

    resetQueryState() {

        this.queryState = {

            /**
             * Query Typ
             */

            type: 'select',

            /**
             * Tabelle
             */

            table: this.table,

            alias: null,

            /**
             * SELECT
             */

            distinct: false,

            columns: ['*'],

            /**
             * JOIN
             */

            joins: [],

            /**
             * WHERE
             */

            wheres: [],

            /**
             * GROUP BY
             */

            groups: [],

            /**
             * HAVING
             */

            havings: [],

            /**
             * ORDER BY
             */

            orders: [],

            /**
             * UNION
             */

            unions: [],

            /**
             * LIMIT / OFFSET
             */

            limit: null,

            offset: null,

            /**
             * Parameter
             */

            bindings: []

        };

        return this;

    }

    /**
     * Neue Query beginnen.
     *
     * Beispiel:
     *
     * movieRepository
     *     .query()
     *     .select('*')
     */

    query() {

        return this.resetQueryState();

    }
    
        /**
     * ============================================================
     * Datenbankzugriff
     * ============================================================
     */

    /**
     * Datenbankinstanz zurückgeben.
     *
     * @returns {*}
     */
    getDatabase() {

        return this.db;

    }

    /**
     * Aktuelle Tabelle zurückgeben.
     *
     * @returns {string}
     */
    getTable() {

        return this.table;

    }

    /**
     * Primärschlüssel zurückgeben.
     *
     * @returns {string}
     */
    getPrimaryKey() {

        return this.primaryKey;

    }

    /**
     * Prepared Statement erzeugen.
     *
     * @param {string} sql
     * @returns {*}
     */
    prepare(sql) {

        this.log(sql);

        return this.db.prepare(sql);

    }

    /**
     * SQL direkt ausführen (INSERT / UPDATE / DELETE).
     *
     * @param {string} sql
     * @param {Array} bindings
     * @returns {*}
     */
    execute(sql, bindings = []) {

        try {

            this.log(sql, bindings);

            return this.db
                .prepare(sql)
                .run(bindings);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * Alias für execute().
     *
     * @param {string} sql
     * @param {Array} bindings
     * @returns {*}
     */
    run(sql, bindings = []) {

        return this.execute(sql, bindings);

    }

    /**
     * Einen Datensatz abrufen.
     *
     * @param {string} sql
     * @param {Array} bindings
     * @returns {*}
     */
    get(sql, bindings = []) {

        try {

            this.log(sql, bindings);

            return this.db
                .prepare(sql)
                .get(bindings);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * Mehrere Datensätze abrufen.
     *
     * @param {string} sql
     * @param {Array} bindings
     * @returns {Array}
     */
    all(sql, bindings = []) {

        try {

            this.log(sql, bindings);

            return this.db
                .prepare(sql)
                .all(bindings);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * SQL ohne Rückgabewert ausführen.
     *
     * Geeignet für:
     * - CREATE TABLE
     * - ALTER TABLE
     * - DROP TABLE
     * - PRAGMA
     * - VACUUM
     *
     * @param {string} sql
     * @returns {*}
     */
    exec(sql) {

        this.log(sql);

        try {

            return this.db.exec(sql);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * SQL-Pragma ausführen.
     *
     * @param {string} pragma
     * @returns {*}
     */
    pragma(pragma) {

        this.log(`PRAGMA ${pragma}`);

        try {

            return this.db.pragma(pragma);

        } catch (error) {

            this.handleError(error);

        }

    }

    /**
     * Statement im Cache vorbereiten.
     *
     * Bereitet häufig verwendete Statements vor,
     * damit sie mehrfach verwendet werden können.
     *
     * @param {string} sql
     * @returns {*}
     */
    cachedStatement(sql) {

        if (!this.statementCache) {

            this.statementCache = new Map();

        }

        if (!this.statementCache.has(sql)) {

            this.statementCache.set(
                sql,
                this.db.prepare(sql)
            );

        }

        return this.statementCache.get(sql);

    }

    /**
     * Statement-Cache leeren.
     *
     * @returns {BaseRepository}
     */
    clearStatementCache() {

        if (this.statementCache) {

            this.statementCache.clear();

        }

        return this;

    }
    
        /**
     * ============================================================
     * Logging & Error Handling
     * ============================================================
     */

    /**
     * Query Logging aktivieren.
     *
     * @returns {BaseRepository}
     */
    enableQueryLogging() {

        this.enableLogging = true;

        return this;

    }

    /**
     * Query Logging deaktivieren.
     *
     * @returns {BaseRepository}
     */
    disableQueryLogging() {

        this.enableLogging = false;

        return this;

    }

    /**
     * Zeitstempel erzeugen.
     *
     * @returns {string}
     */
    now() {

        return new Date().toISOString();

    }

    /**
     * Hochauflösende Zeitmessung starten.
     *
     * @returns {bigint}
     */
    startTimer() {

        return process.hrtime.bigint();

    }

    /**
     * Laufzeit berechnen.
     *
     * @param {bigint} started
     * @returns {number}
     */
    stopTimer(started) {

        const finished = process.hrtime.bigint();

        return Number(finished - started) / 1000000;

    }

    /**
     * SQL protokollieren.
     *
     * @param {string} sql
     * @param {Array} bindings
     * @param {number|null} duration
     */
    log(sql, bindings = [], duration = null) {

        if (!this.enableLogging) {

            return;

        }

        console.log(
            '============================================================'
        );

        console.log('[Repository]');

        console.log('Repository :', this.constructor.name);

        console.log('Tabelle    :', this.table);

        console.log('Zeit       :', this.now());

        console.log('SQL        :', sql);

        if (Array.isArray(bindings) && bindings.length > 0) {

            console.log('Bindings   :', bindings);

        }

        if (duration !== null) {

            console.log(
                'Laufzeit   :',
                `${duration.toFixed(3)} ms`
            );

        }

        console.log(
            '============================================================'
        );

    }

    /**
     * Debug-Ausgabe.
     *
     * @param {...*} args
     */
    debug(...args) {

        if (!this.enableLogging) {

            return;

        }

        console.log('[DEBUG]', ...args);

    }

    /**
     * Warnung protokollieren.
     *
     * @param {...*} args
     */
    warn(...args) {

        console.warn('[WARNING]', ...args);

    }

    /**
     * Informationen protokollieren.
     *
     * @param {...*} args
     */
    info(...args) {

        console.info('[INFO]', ...args);

    }

    /**
     * Fehler zentral behandeln.
     *
     * @param {Error} error
     */
    handleError(error) {

        console.error(
            '============================================================'
        );

        console.error('[Repository Error]');

        console.error(
            'Repository :',
            this.constructor.name
        );

        console.error(
            'Tabelle    :',
            this.table
        );

        console.error(
            'Zeit       :',
            this.now()
        );

        if (error instanceof Error) {

            console.error(
                'Nachricht  :',
                error.message
            );

            if (error.stack) {

                console.error(
                    'Stacktrace :'
                );

                console.error(error.stack);

            }

        } else {

            console.error(error);

        }

        console.error(
            '============================================================'
        );

        throw error;

    }

    /**
     * SQL mit Laufzeit messen.
     *
     * @param {Function} callback
     * @returns {*}
     */
    measure(callback) {

        const started = this.startTimer();

        const result = callback();

        const duration = this.stopTimer(started);

        this.debug(
            `Ausführungszeit: ${duration.toFixed(3)} ms`
        );

        return result;

    }
    
        /**
     * ============================================================
     * Validierung
     * ============================================================
     */

    /**
     * Prüft auf undefined oder null.
     *
     * @param {*} value
     * @param {string} field
     * @returns {*}
     */
    validateRequired(value, field = 'Wert') {

        if (value === undefined || value === null) {

            throw new Error(`${field} darf nicht leer sein.`);

        }

        return value;

    }

    /**
     * String validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {string}
     */
    validateString(value, field = 'String') {

        this.validateRequired(value, field);

        if (typeof value !== 'string') {

            throw new TypeError(`${field} muss ein String sein.`);

        }

        const result = value.trim();

        if (result.length === 0) {

            throw new Error(`${field} darf nicht leer sein.`);

        }

        return result;

    }

    /**
     * Zahl validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {number}
     */
    validateNumber(value, field = 'Zahl') {

        this.validateRequired(value, field);

        if (typeof value !== 'number') {

            throw new TypeError(`${field} muss eine Zahl sein.`);

        }

        if (!Number.isFinite(value)) {

            throw new Error(`${field} ist keine gültige Zahl.`);

        }

        return value;

    }

    /**
     * Boolean validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {boolean}
     */
    validateBoolean(value, field = 'Boolean') {

        this.validateRequired(value, field);

        if (typeof value !== 'boolean') {

            throw new TypeError(`${field} muss true oder false sein.`);

        }

        return value;

    }

    /**
     * Array validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {Array}
     */
    validateArray(value, field = 'Array') {

        this.validateRequired(value, field);

        if (!Array.isArray(value)) {

            throw new TypeError(`${field} muss ein Array sein.`);

        }

        return value;

    }

    /**
     * Objekt validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {Object}
     */
    validateObject(value, field = 'Objekt') {

        this.validateRequired(value, field);

        if (Array.isArray(value)) {

            throw new TypeError(`${field} darf kein Array sein.`);

        }

        if (typeof value !== 'object') {

            throw new TypeError(`${field} muss ein Objekt sein.`);

        }

        return value;

    }

    /**
     * Funktion validieren.
     *
     * @param {*} value
     * @param {string} field
     * @returns {Function}
     */
    validateFunction(value, field = 'Callback') {

        if (typeof value !== 'function') {

            throw new TypeError(`${field} muss eine Funktion sein.`);

        }

        return value;

    }

    /**
     * ID validieren.
     *
     * @param {*} id
     * @returns {*}
     */
    validateId(id) {

        this.validateRequired(id, 'ID');

        if (typeof id !== 'number' && typeof id !== 'string') {

            throw new Error('Ungültige ID.');

        }

        return id;

    }

    /**
     * SQL-Identifier validieren.
     *
     * Erlaubt:
     * A-Z
     * a-z
     * 0-9
     * _
     *
     * @param {string} identifier
     * @returns {string}
     */
    validateIdentifier(identifier) {

        identifier = this.validateString(identifier, 'Identifier');

        const regex = /^[A-Za-z_][A-Za-z0-9_]*$/;

        if (!regex.test(identifier)) {

            throw new Error(

                `Ungültiger SQL-Identifier: ${identifier}`

            );

        }

        return identifier;

    }

    /**
     * Tabellenname validieren.
     *
     * @returns {string}
     */
    validateTable() {

        return this.validateIdentifier(this.table);

    }

    /**
     * Spaltenname validieren.
     *
     * @param {string} column
     * @returns {string}
     */
    validateColumn(column) {

        return this.validateIdentifier(column);

    }

    /**
     * SQL-Operator validieren.
     *
     * @param {string} operator
     * @returns {string}
     */
    validateOperator(operator) {

        const allowed = [

            '=',
            '!=',
            '<>',
            '>',
            '<',
            '>=',
            '<=',
            'LIKE',
            'NOT LIKE',
            'IN',
            'NOT IN',
            'BETWEEN',
            'IS',
            'IS NOT'

        ];

        operator = this
            .validateString(operator, 'Operator')
            .toUpperCase();

        if (!allowed.includes(operator)) {

            throw new Error(

                `Ungültiger SQL-Operator: ${operator}`

            );

        }

        return operator;

    }

    /**
     * Sortierrichtung validieren.
     *
     * @param {string} direction
     * @returns {string}
     */
    validateDirection(direction) {

        direction = this
            .validateString(direction, 'Sortierung')
            .toUpperCase();

        if (!['ASC', 'DESC'].includes(direction)) {

            throw new Error(

                'Sortierung muss ASC oder DESC sein.'

            );

        }

        return direction;

    }

    /**
     * LIMIT validieren.
     *
     * @param {number} limit
     * @returns {number}
     */
    validateLimit(limit) {

        limit = this.validateNumber(limit, 'Limit');

        if (limit < 0) {

            throw new Error(

                'Limit darf nicht negativ sein.'

            );

        }

        return limit;

    }

    /**
     * OFFSET validieren.
     *
     * @param {number} offset
     * @returns {number}
     */
    validateOffset(offset) {

        offset = this.validateNumber(offset, 'Offset');

        if (offset < 0) {

            throw new Error(

                'Offset darf nicht negativ sein.'

            );

        }

        return offset;

    }
    
        /**
     * ============================================================
     * Query Engine
     * ============================================================
     */

    /**
     * Query zurücksetzen.
     *
     * @returns {BaseRepository}
     */
    resetQuery() {

        this.queryState = {

            type: 'select',

            table: this.table,

            alias: null,

            distinct: false,

            columns: ['*'],

            joins: [],

            wheres: [],

            groups: [],

            havings: [],

            orders: [],

            unions: [],

            limit: null,

            offset: null,

            bindings: []

        };

        return this;

    }

    /**
     * Neue Query starten.
     *
     * @returns {BaseRepository}
     */
    query() {

        return this.resetQuery();

    }

    /**
     * Parameter hinzufügen.
     *
     * @param {*} value
     * @returns {BaseRepository}
     */
    addBinding(value) {

        this.queryState.bindings.push(value);

        return this;

    }

    /**
     * Mehrere Parameter hinzufügen.
     *
     * @param {Array} values
     * @returns {BaseRepository}
     */
    addBindings(values = []) {

        this.validateArray(values);

        this.queryState.bindings.push(...values);

        return this;

    }

    /**
     * Alle Parameter zurückgeben.
     *
     * @returns {Array}
     */
    getBindings() {

        return [...this.queryState.bindings];

    }

    /**
     * Parameter zurücksetzen.
     *
     * @returns {BaseRepository}
     */
    clearBindings() {

        this.queryState.bindings = [];

        return this;

    }

    /**
     * Query-Typ setzen.
     *
     * @param {string} type
     * @returns {BaseRepository}
     */
    setQueryType(type) {

        this.queryState.type = type;

        return this;

    }

    /**
     * Query-Typ abrufen.
     *
     * @returns {string}
     */
    getQueryType() {

        return this.queryState.type;

    }

    /**
     * Tabellenalias setzen.
     *
     * @param {string} alias
     * @returns {BaseRepository}
     */
    setAlias(alias) {

        this.validateIdentifier(alias);

        this.queryState.alias = alias;

        return this;

    }

    /**
     * Tabellenalias abrufen.
     *
     * @returns {string|null}
     */
    getAlias() {

        return this.queryState.alias;

    }

    /**
     * Aktuelle Tabelle ändern.
     *
     * @param {string} table
     * @returns {BaseRepository}
     */
    from(table) {

        this.validateIdentifier(table);

        this.queryState.table = table;

        return this;

    }

    /**
     * Aktuelle Tabelle zurückgeben.
     *
     * @returns {string}
     */
    getQueryTable() {

        return this.queryState.table;

    }

    /**
     * Query-Status zurückgeben.
     *
     * @returns {Object}
     */
    getQueryState() {

        return structuredClone(this.queryState);

    }

    /**
     * Prüfen, ob Bedingungen existieren.
     *
     * @returns {boolean}
     */
    hasWhere() {

        return this.queryState.wheres.length > 0;

    }

    /**
     * Prüfen, ob JOINs existieren.
     *
     * @returns {boolean}
     */
    hasJoins() {

        return this.queryState.joins.length > 0;

    }

    /**
     * Prüfen, ob GROUP BY existiert.
     *
     * @returns {boolean}
     */
    hasGroups() {

        return this.queryState.groups.length > 0;

    }

    /**
     * Prüfen, ob HAVING existiert.
     *
     * @returns {boolean}
     */
    hasHaving() {

        return this.queryState.havings.length > 0;

    }

    /**
     * Prüfen, ob ORDER BY existiert.
     *
     * @returns {boolean}
     */
    hasOrderBy() {

        return this.queryState.orders.length > 0;

    }

    /**
     * Query komplett leeren.
     *
     * @returns {BaseRepository}
     */
    clearQuery() {

        return this.resetQuery();

    }
    
        /**
     * ============================================================
     * SELECT Engine
     * ============================================================
     */

    /**
     * SELECT-Spalten festlegen.
     *
     * @param  {...string} columns
     * @returns {BaseRepository}
     */
    select(...columns) {

        if (columns.length === 0) {

            columns = ['*'];

        }

        this.queryState.columns = [];

        for (const column of columns.flat()) {

            if (column !== '*') {

                this.validateString(column, 'Spalte');

            }

            this.queryState.columns.push(column);

        }

        return this;

    }

    /**
     * Weitere SELECT-Spalten hinzufügen.
     *
     * @param  {...string} columns
     * @returns {BaseRepository}
     */
    addSelect(...columns) {

        for (const column of columns.flat()) {

            if (column !== '*') {

                this.validateString(column, 'Spalte');

            }

            this.queryState.columns.push(column);

        }

        return this;

    }

    /**
     * DISTINCT aktivieren/deaktivieren.
     *
     * @param {boolean} enabled
     * @returns {BaseRepository}
     */
    distinct(enabled = true) {

        this.queryState.distinct = Boolean(enabled);

        return this;

    }

    /**
     * Alias für DISTINCT.
     *
     * @returns {BaseRepository}
     */
    unique() {

        return this.distinct(true);

    }

    /**
     * Rohes SQL in SELECT aufnehmen.
     *
     * Beispiel:
     * COUNT(*) AS total
     *
     * @param {string} expression
     * @returns {BaseRepository}
     */
    selectRaw(expression) {

        this.validateString(expression);

        this.queryState.columns.push({

            raw: true,

            expression

        });

        return this;

    }

    /**
     * COUNT(*)
     *
     * @param {string} alias
     * @returns {BaseRepository}
     */
    selectCount(alias = 'count') {

        return this.selectRaw(

            `COUNT(*) AS ${alias}`

        );

    }

    /**
     * SUM()
     *
     * @param {string} column
     * @param {string} alias
     * @returns {BaseRepository}
     */
    selectSum(column, alias = 'sum') {

        this.validateIdentifier(column);

        return this.selectRaw(

            `SUM(${column}) AS ${alias}`

        );

    }

    /**
     * AVG()
     *
     * @param {string} column
     * @param {string} alias
     * @returns {BaseRepository}
     */
    selectAvg(column, alias = 'avg') {

        this.validateIdentifier(column);

        return this.selectRaw(

            `AVG(${column}) AS ${alias}`

        );

    }

    /**
     * MAX()
     *
     * @param {string} column
     * @param {string} alias
     * @returns {BaseRepository}
     */
    selectMax(column, alias = 'max') {

        this.validateIdentifier(column);

        return this.selectRaw(

            `MAX(${column}) AS ${alias}`

        );

    }

    /**
     * MIN()
     *
     * @param {string} column
     * @param {string} alias
     * @returns {BaseRepository}
     */
    selectMin(column, alias = 'min') {

        this.validateIdentifier(column);

        return this.selectRaw(

            `MIN(${column}) AS ${alias}`

        );

    }

    /**
     * Alle SELECT-Spalten löschen.
     *
     * @returns {BaseRepository}
     */
    clearSelect() {

        this.queryState.columns = ['*'];

        return this;

    }

    /**
     * Aktuelle SELECT-Spalten zurückgeben.
     *
     * @returns {Array}
     */
    getSelects() {

        return [...this.queryState.columns];

    }
    
        /**
     * ============================================================
     * WHERE Engine
     * ============================================================
     */

    /**
     * WHERE
     *
     * @param {string} column
     * @param {string|*} operator
     * @param {*} value
     * @returns {BaseRepository}
     */
    where(column, operator, value = null) {

        this.validateIdentifier(column);

        if (arguments.length === 2) {

            value = operator;
            operator = '=';

        }

        operator = this.validateOperator(operator);

        this.queryState.wheres.push({

            boolean: 'AND',

            column,

            operator,

            value

        });

        this.addBinding(value);

        return this;

    }

    /**
     * OR WHERE
     */

    orWhere(column, operator, value = null) {

        this.validateIdentifier(column);

        if (arguments.length === 2) {

            value = operator;
            operator = '=';

        }

        operator = this.validateOperator(operator);

        this.queryState.wheres.push({

            boolean: 'OR',

            column,

            operator,

            value

        });

        this.addBinding(value);

        return this;

    }

    /**
     * WHERE NOT
     */

    whereNot(column, value) {

        return this.where(column, '!=', value);

    }

    /**
     * WHERE LIKE
     */

    whereLike(column, value) {

        return this.where(column, 'LIKE', `%${value}%`);

    }

    /**
     * WHERE NOT LIKE
     */

    whereNotLike(column, value) {

        return this.where(column, 'NOT LIKE', `%${value}%`);

    }

    /**
     * WHERE NULL
     */

    whereNull(column) {

        this.validateIdentifier(column);

        this.queryState.wheres.push({

            boolean: 'AND',

            raw: `${column} IS NULL`

        });

        return this;

    }

    /**
     * WHERE NOT NULL
     */

    whereNotNull(column) {

        this.validateIdentifier(column);

        this.queryState.wheres.push({

            boolean: 'AND',

            raw: `${column} IS NOT NULL`

        });

        return this;

    }

    /**
     * WHERE IN
     */

    whereIn(column, values) {

        this.validateIdentifier(column);

        this.validateArray(values);

        this.queryState.wheres.push({

            boolean: 'AND',

            column,

            operator: 'IN',

            value: values

        });

        this.addBindings(values);

        return this;

    }

    /**
     * WHERE NOT IN
     */

    whereNotIn(column, values) {

        this.validateIdentifier(column);

        this.validateArray(values);

        this.queryState.wheres.push({

            boolean: 'AND',

            column,

            operator: 'NOT IN',

            value: values

        });

        this.addBindings(values);

        return this;

    }

    /**
     * WHERE BETWEEN
     */

    whereBetween(column, start, end) {

        this.validateIdentifier(column);

        this.queryState.wheres.push({

            boolean: 'AND',

            column,

            operator: 'BETWEEN',

            value: [

                start,

                end

            ]

        });

        this.addBinding(start);

        this.addBinding(end);

        return this;

    }

    /**
     * WHERE RAW
     */

    whereRaw(sql, bindings = []) {

        this.validateString(sql);

        this.queryState.wheres.push({

            boolean: 'AND',

            raw: sql

        });

        this.addBindings(bindings);

        return this;

    }

    /**
     * Prüfen ob WHERE vorhanden.
     */

    hasWhere() {

        return this.queryState.wheres.length > 0;

    }

    /**
     * WHERE löschen.
     */

    clearWhere() {

        this.queryState.wheres = [];

        this.clearBindings();

        return this;

    }
    
        /**
     * ============================================================
     * JOIN Engine
     * ============================================================
     */

    /**
     * Allgemeiner JOIN.
     *
     * @param {string} type
     * @param {string} table
     * @param {string} first
     * @param {string} operator
     * @param {string} second
     * @returns {BaseRepository}
     */
    join(type, table, first, operator, second) {

        type = this.validateString(type).toUpperCase();

        const allowed = [
            'INNER',
            'LEFT',
            'RIGHT',
            'FULL',
            'CROSS'
        ];

        if (!allowed.includes(type)) {

            throw new Error(
                `Ungültiger JOIN-Typ: ${type}`
            );

        }

        this.validateString(table);
        this.validateString(first);
        this.validateOperator(operator);
        this.validateString(second);

        this.queryState.joins.push({

            type,

            table,

            first,

            operator,

            second

        });

        return this;

    }

    /**
     * INNER JOIN
     */

    innerJoin(table, first, operator, second) {

        return this.join(
            'INNER',
            table,
            first,
            operator,
            second
        );

    }

    /**
     * LEFT JOIN
     */

    leftJoin(table, first, operator, second) {

        return this.join(
            'LEFT',
            table,
            first,
            operator,
            second
        );

    }

    /**
     * RIGHT JOIN
     */

    rightJoin(table, first, operator, second) {

        return this.join(
            'RIGHT',
            table,
            first,
            operator,
            second
        );

    }

    /**
     * FULL JOIN
     */

    fullJoin(table, first, operator, second) {

        return this.join(
            'FULL',
            table,
            first,
            operator,
            second
        );

    }

    /**
     * CROSS JOIN
     */

    crossJoin(table) {

        this.validateString(table);

        this.queryState.joins.push({

            type: 'CROSS',

            table

        });

        return this;

    }

    /**
     * JOIN mit rohem SQL.
     */

    joinRaw(sql, bindings = []) {

        this.validateString(sql);

        this.queryState.joins.push({

            raw: true,

            sql

        });

        this.addBindings(bindings);

        return this;

    }

    /**
     * Existieren JOINs?
     */

    hasJoins() {

        return this.queryState.joins.length > 0;

    }

    /**
     * JOINs löschen.
     */

    clearJoins() {

        this.queryState.joins = [];

        return this;

    }

    /**
     * JOINs abrufen.
     */

    getJoins() {

        return [...this.queryState.joins];

    }
    
        /**
     * ============================================================
     * SQL Builder
     * ============================================================
     */

    /**
     * Erstellt das finale SQL.
     *
     * @returns {string}
     */
    build() {

        const sql = [];

        /*
         * SELECT
         */

        sql.push('SELECT');

        if (this.queryState.distinct) {

            sql.push('DISTINCT');

        }

        const columns = this.queryState.columns.map(column => {

            if (typeof column === 'object' && column.raw) {

                return column.expression;

            }

            return column;

        });

        sql.push(columns.join(', '));

        /*
         * FROM
         */

        sql.push('FROM');

        sql.push(this.queryState.table);

        if (this.queryState.alias) {

            sql.push(this.queryState.alias);

        }

        /*
         * JOIN
         */

        for (const join of this.queryState.joins) {

            if (join.raw) {

                sql.push(join.sql);

                continue;

            }

            if (join.type === 'CROSS') {

                sql.push(

                    `CROSS JOIN ${join.table}`

                );

                continue;

            }

            sql.push(

                `${join.type} JOIN ${join.table} ON ${join.first} ${join.operator} ${join.second}`

            );

        }

        /*
         * WHERE
         */

        if (this.queryState.wheres.length > 0) {

            sql.push('WHERE');

            this.queryState.wheres.forEach((where, index) => {

                if (index > 0) {

                    sql.push(where.boolean);

                }

                if (where.raw) {

                    sql.push(where.raw);

                    return;

                }

                if (
                    where.operator === 'IN' ||
                    where.operator === 'NOT IN'
                ) {

                    const placeholders = where.value
                        .map(() => '?')
                        .join(', ');

                    sql.push(

                        `${where.column} ${where.operator} (${placeholders})`

                    );

                    return;

                }

                if (where.operator === 'BETWEEN') {

                    sql.push(

                        `${where.column} BETWEEN ? AND ?`

                    );

                    return;

                }

                sql.push(

                    `${where.column} ${where.operator} ?`

                );

            });

        }

        return sql.join(' ');

    }

    /**
     * SQL anzeigen.
     *
     * @returns {string}
     */
    toSql() {

        return this.build();

    }

    /**
     * Parameter anzeigen.
     *
     * @returns {Array}
     */
    bindings() {

        return this.getBindings();

    }

    /**
     * Query zurückgeben.
     *
     * @returns {Object}
     */
    toQuery() {

        return {

            sql: this.build(),

            bindings: this.getBindings()

        };

    }