/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/QueryBuilder.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Universeller SQL Query Builder für SQLite.
 *
 * Unterstützt:
 *
 * - SELECT
 * - INSERT
 * - UPDATE
 * - DELETE
 * - DISTINCT
 * - WHERE
 * - OR WHERE
 * - BETWEEN
 * - IN
 * - NULL
 * - EXISTS
 * - JOIN
 * - GROUP BY
 * - HAVING
 * - ORDER BY
 * - LIMIT
 * - OFFSET
 * - PAGINATION
 * - AGGREGATE
 * - SUBQUERY
 * - UNION
 * - CHUNK
 * - CURSOR
 * - RAW SQL
 * - UPSERT
 *
 * Optimiert für:
 *
 * - better-sqlite3
 * - BaseRepository
 * - DatabaseManager
 *
 * Version:
 * 2.0.0
 * ========================================================================
 */

'use strict';

class QueryBuilder {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(repository) {

        if (!repository) {

            throw new Error(
                'QueryBuilder benötigt ein Repository.'
            );

        }

        this.repository = repository;

        this.db = repository.getDatabase();

        this.table = repository.getTable();

        this.reset();

    }

    /**
     * ============================================================
     * Initialisierung
     * ============================================================
     */

    reset() {

        this.type = 'select';

        this.selects = [];

        this.joins = [];

        this.wheres = [];

        this.groups = [];

        this.havings = [];

        this.orders = [];

        this.unions = [];

        this.values = [];

        this.limitValue = null;

        this.offsetValue = null;

        this.aliasValue = null;

        this.distinctValue = false;

        this.rawSql = null;

        this.insertData = null;

        this.updateData = null;

        this.deleteMode = false;

        return this;

    }

    /**
     * ============================================================
     * SELECT
     * ============================================================
     */

    select(...columns) {

        if (columns.length === 0) {

            this.selects = ['*'];

            return this;

        }

        this.selects = [];

        for (const column of columns) {

            if (Array.isArray(column)) {

                this.selects.push(...column);

                continue;

            }

            this.selects.push(column);

        }

        return this;

    }

    /**
     * SELECT *
     */

    selectAll() {

        this.selects = ['*'];

        return this;

    }

    /**
     * DISTINCT
     */

    distinct(state = true) {

        this.distinctValue = Boolean(state);

        return this;

    }

    /**
     * FROM
     */

    from(table) {

        this.repository.validateIdentifier(table);

        this.table = table;

        return this;

    }

    /**
     * Alias
     */

    as(alias) {

        this.repository.validateIdentifier(alias);

        this.aliasValue = alias;

        return this;

    }

    /**
     * RAW SQL
     */

    raw(sql) {

        this.repository.validateString(sql);

        this.rawSql = sql;

        return this;

    }

    /**
     * ============================================================
     * Query-Typ
     * ============================================================
     */

    insert(data) {

        this.type = 'insert';

        this.insertData = data;

        return this;

    }

    update(data) {

        this.type = 'update';

        this.updateData = data;

        return this;

    }

    delete() {

        this.type = 'delete';

        this.deleteMode = true;

        return this;

    }

    /**
     * ============================================================
     * Clone
     * ============================================================
     */

    clone() {

        const builder = new QueryBuilder(this.repository);

        builder.type = this.type;

        builder.table = this.table;

        builder.aliasValue = this.aliasValue;

        builder.distinctValue = this.distinctValue;

        builder.selects = [...this.selects];

        builder.joins = [...this.joins];

        builder.wheres = [...this.wheres];

        builder.groups = [...this.groups];

        builder.havings = [...this.havings];

        builder.orders = [...this.orders];

        builder.unions = [...this.unions];

        builder.values = [...this.values];

        builder.limitValue = this.limitValue;

        builder.offsetValue = this.offsetValue;

        builder.rawSql = this.rawSql;

        builder.insertData = this.insertData;

        builder.updateData = this.updateData;

        builder.deleteMode = this.deleteMode;

        return builder;

    }

    /**
     * ============================================================
     * Hilfsfunktionen
     * ============================================================
     */

    addValue(value) {

        this.values.push(value);

        return this;

    }

    addValues(values) {

        if (!Array.isArray(values)) {

            return this.addValue(values);

        }

        this.values.push(...values);

        return this;

    }

    clearValues() {

        this.values = [];

        return this;

    }

    hasWhere() {

        return this.wheres.length > 0;

    }

    hasJoin() {

        return this.joins.length > 0;

    }

    hasGroup() {

        return this.groups.length > 0;

    }

    hasOrder() {

        return this.orders.length > 0;

    }

    hasUnion() {

        return this.unions.length > 0;

    }
    
        /**
     * ============================================================
     * WHERE
     * ============================================================
     */

    where(column, operator, value = null) {

        if (arguments.length === 2) {

            value = operator;
            operator = '=';

        }

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} ${operator} ?`

        });

        this.values.push(value);

        return this;

    }

    /**
     * OR WHERE
     */

    orWhere(column, operator, value = null) {

        if (arguments.length === 2) {

            value = operator;
            operator = '=';

        }

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'OR',

            sql: `${column} ${operator} ?`

        });

        this.values.push(value);

        return this;

    }

    /**
     * WHERE NOT
     */

    whereNot(column, value) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} <> ?`

        });

        this.values.push(value);

        return this;

    }

    /**
     * WHERE LIKE
     */

    whereLike(column, value) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} LIKE ?`

        });

        this.values.push(`%${value}%`);

        return this;

    }

    /**
     * WHERE NOT LIKE
     */

    whereNotLike(column, value) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} NOT LIKE ?`

        });

        this.values.push(`%${value}%`);

        return this;

    }

    /**
     * WHERE IN
     */

    whereIn(column, values) {

        this.repository.validateIdentifier(column);

        this.repository.validateArray(values);

        if (values.length === 0) {

            return this;

        }

        const placeholders = values
            .map(() => '?')
            .join(', ');

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} IN (${placeholders})`

        });

        this.values.push(...values);

        return this;

    }

    /**
     * WHERE NOT IN
     */

    whereNotIn(column, values) {

        this.repository.validateIdentifier(column);

        this.repository.validateArray(values);

        if (values.length === 0) {

            return this;

        }

        const placeholders = values
            .map(() => '?')
            .join(', ');

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} NOT IN (${placeholders})`

        });

        this.values.push(...values);

        return this;

    }

    /**
     * WHERE BETWEEN
     */

    whereBetween(column, min, max) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} BETWEEN ? AND ?`

        });

        this.values.push(min);

        this.values.push(max);

        return this;

    }

    /**
     * WHERE NOT BETWEEN
     */

    whereNotBetween(column, min, max) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} NOT BETWEEN ? AND ?`

        });

        this.values.push(min);

        this.values.push(max);

        return this;

    }

    /**
     * WHERE NULL
     */

    whereNull(column) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} IS NULL`

        });

        return this;

    }

    /**
     * WHERE NOT NULL
     */

    whereNotNull(column) {

        this.repository.validateIdentifier(column);

        this.wheres.push({

            boolean: 'AND',

            sql: `${column} IS NOT NULL`

        });

        return this;

    }

    /**
     * WHERE EXISTS
     */

    whereExists(subQuery) {

        if (!(subQuery instanceof QueryBuilder)) {

            throw new Error(
                'whereExists erwartet einen QueryBuilder.'
            );

        }

        const query = subQuery.build();

        this.wheres.push({

            boolean: 'AND',

            sql: `EXISTS (${query.sql})`

        });

        this.values.push(...query.values);

        return this;

    }

    /**
     * WHERE NOT EXISTS
     */

    whereNotExists(subQuery) {

        if (!(subQuery instanceof QueryBuilder)) {

            throw new Error(
                'whereNotExists erwartet einen QueryBuilder.'
            );

        }

        const query = subQuery.build();

        this.wheres.push({

            boolean: 'AND',

            sql: `NOT EXISTS (${query.sql})`

        });

        this.values.push(...query.values);

        return this;

    }

    /**
     * WHERE RAW
     */

    whereRaw(sql, values = []) {

        this.repository.validateString(sql);

        this.wheres.push({

            boolean: 'AND',

            sql

        });

        if (Array.isArray(values)) {

            this.values.push(...values);

        }

        return this;

    }

    /**
     * ============================================================
     * ENDE WHERE
     * ============================================================
     */

    /**
     * ============================================================
     * JOINS
     * ============================================================
     */

    join(table, first, operator, second) {

        this.repository.validateIdentifier(table);

        this.joins.push({
            type: 'INNER',
            table,
            first,
            operator,
            second
        });

        return this;

    }

    /**
     * LEFT JOIN
     */

    leftJoin(table, first, operator, second) {

        this.repository.validateIdentifier(table);

        this.joins.push({
            type: 'LEFT',
            table,
            first,
            operator,
            second
        });

        return this;

    }

    /**
     * RIGHT JOIN
     */

    rightJoin(table, first, operator, second) {

        this.repository.validateIdentifier(table);

        this.joins.push({
            type: 'RIGHT',
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

        this.repository.validateIdentifier(table);

        this.joins.push({

            type: 'CROSS',

            table

        });

        return this;

    }

    /**
     * ============================================================
     * GROUP BY
     * ============================================================
     */

    groupBy(...columns) {

        if (columns.length === 0) {

            return this;

        }

        for (const column of columns) {

            if (Array.isArray(column)) {

                this.groups.push(...column);

                continue;

            }

            this.groups.push(column);

        }

        return this;

    }

    /**
     * ============================================================
     * HAVING
     * ============================================================
     */

    having(column, operator, value = null) {

        if (arguments.length === 2) {

            value = operator;

            operator = '=';

        }

        this.havings.push({

            boolean: 'AND',

            sql: `${column} ${operator} ?`

        });

        this.values.push(value);

        return this;

    }

    /**
     * OR HAVING
     */

    orHaving(column, operator, value = null) {

        if (arguments.length === 2) {

            value = operator;

            operator = '=';

        }

        this.havings.push({

            boolean: 'OR',

            sql: `${column} ${operator} ?`

        });

        this.values.push(value);

        return this;

    }

    /**
     * HAVING RAW
     */

    havingRaw(sql, values = []) {

        this.repository.validateString(sql);

        this.havings.push({

            boolean: 'AND',

            sql

        });

        if (Array.isArray(values)) {

            this.values.push(...values);

        }

        return this;

    }

    /**
     * ============================================================
     * ORDER BY
     * ============================================================
     */

    orderBy(column, direction = 'ASC') {

        direction = direction.toUpperCase();

        if (!['ASC', 'DESC'].includes(direction)) {

            throw new Error(
                'Ungültige Sortierreihenfolge.'
            );

        }

        this.orders.push({

            column,

            direction

        });

        return this;

    }

    /**
     * ORDER BY RAW
     */

    orderByRaw(sql) {

        this.repository.validateString(sql);

        this.orders.push({

            raw: sql

        });

        return this;

    }

    /**
     * Zufällige Sortierung
     */

    random() {

        this.orders.push({

            raw: 'RANDOM()'

        });

        return this;

    }

    /**
     * ============================================================
     * LIMIT
     * ============================================================
     */

    limit(limit) {

        this.repository.validateNumber(
            limit,
            'Limit'
        );

        this.limitValue = limit;

        return this;

    }

    /**
     * OFFSET
     * ============================================================
     */

    offset(offset) {

        this.repository.validateNumber(
            offset,
            'Offset'
        );

        this.offsetValue = offset;

        return this;

    }

    /**
     * Pagination
     */

    paginate(page = 1, perPage = 25) {

        this.repository.validateNumber(
            page,
            'Seite'
        );

        this.repository.validateNumber(
            perPage,
            'Einträge'
        );

        page = Math.max(page, 1);

        perPage = Math.max(perPage, 1);

        this.limitValue = perPage;

        this.offsetValue = (page - 1) * perPage;

        return this;

    }

    /**
     * Erste Ergebnisse
     */

    take(limit) {

        return this.limit(limit);

    }

    /**
     * Überspringen
     */

    skip(offset) {

        return this.offset(offset);

    }

    /**
     * ============================================================
     * ENDE JOIN / GROUP / ORDER
     * ============================================================
     */

    /**
     * ============================================================
     * UNION
     * ============================================================
     */

    union(query) {

        if (!(query instanceof QueryBuilder)) {

            throw new Error(
                'union erwartet einen QueryBuilder.'
            );

        }

        this.unions.push({

            type: 'UNION',

            query

        });

        return this;

    }

    /**
     * UNION ALL
     */

    unionAll(query) {

        if (!(query instanceof QueryBuilder)) {

            throw new Error(
                'unionAll erwartet einen QueryBuilder.'
            );

        }

        this.unions.push({

            type: 'UNION ALL',

            query

        });

        return this;

    }

    /**
     * ============================================================
     * SQL Builder
     * ============================================================
     */

    build() {

        switch (this.type) {

            case 'insert':

                return this.buildInsert();

            case 'update':

                return this.buildUpdate();

            case 'delete':

                return this.buildDelete();

            default:

                return this.buildSelect();

        }

    }

    /**
     * ============================================================
     * SELECT
     * ============================================================
     */

    buildSelect() {

        let sql = 'SELECT ';

        if (this.distinctValue) {

            sql += 'DISTINCT ';

        }

        sql += this.selects.length
            ? this.selects.join(', ')
            : '*';

        sql += '\nFROM ' + this.table;

        if (this.aliasValue) {

            sql += ' AS ' + this.aliasValue;

        }

        /**
         * JOINS
         */

        for (const join of this.joins) {

            if (join.type === 'CROSS') {

                sql += `

CROSS JOIN ${join.table}`;

                continue;

            }

            sql += `

${join.type} JOIN ${join.table}
ON ${join.first} ${join.operator} ${join.second}`;

        }

        /**
         * WHERE
         */

        if (this.wheres.length > 0) {

            sql += '\nWHERE ';

            this.wheres.forEach((where, index) => {

                if (index > 0) {

                    sql += ` ${where.boolean} `;

                }

                sql += where.sql;

            });

        }

        /**
         * GROUP BY
         */

        if (this.groups.length > 0) {

            sql += `

GROUP BY ${this.groups.join(', ')}`;

        }

        /**
         * HAVING
         */

        if (this.havings.length > 0) {

            sql += '\nHAVING ';

            this.havings.forEach((having, index) => {

                if (index > 0) {

                    sql += ` ${having.boolean} `;

                }

                sql += having.sql;

            });

        }

        /**
         * UNION
         */

        if (this.unions.length > 0) {

            for (const union of this.unions) {

                const result = union.query.build();

                sql += `

${union.type}

${result.sql}`;

                this.values.push(...result.values);

            }

        }

        /**
         * ORDER BY
         */

        if (this.orders.length > 0) {

            sql += '\nORDER BY ';

            sql += this.orders.map(order => {

                if (order.raw) {

                    return order.raw;

                }

                return `${order.column} ${order.direction}`;

            }).join(', ');

        }

        /**
         * LIMIT
         */

        if (this.limitValue !== null) {

            sql += '\nLIMIT ?';

            this.values.push(this.limitValue);

        }

        /**
         * OFFSET
         */

        if (this.offsetValue !== null) {

            sql += '\nOFFSET ?';

            this.values.push(this.offsetValue);

        }

        return {

            sql,

            values: this.values

        };

    }

    /**
     * ============================================================
     * INSERT
     * ============================================================
     */

    buildInsert() {

        this.repository.validateObject(this.insertData);

        const columns = Object.keys(this.insertData);

        const placeholders = columns
            .map(() => '?')
            .join(', ');

        return {

            sql: `
INSERT INTO ${this.table}
(${columns.join(', ')})
VALUES (${placeholders})
            `,

            values: Object.values(this.insertData)

        };

    }

    /**
     * ============================================================
     * UPDATE
     * ============================================================
     */

    buildUpdate() {

        this.repository.validateObject(this.updateData);

        const columns = Object.keys(this.updateData);

        const updates = [];

        const values = [];

        for (const column of columns) {

            updates.push(`${column} = ?`);

            values.push(this.updateData[column]);

        }

        let sql = `
UPDATE ${this.table}
SET
${updates.join(',\n')}
`;

        if (this.wheres.length > 0) {

            sql += '\nWHERE ';

            this.wheres.forEach((where, index) => {

                if (index > 0) {

                    sql += ` ${where.boolean} `;

                }

                sql += where.sql;

            });

        }

        values.push(...this.values);

        return {

            sql,

            values

        };

    }

    /**
     * ============================================================
     * DELETE
     * ============================================================
     */

    buildDelete() {

        let sql = `

DELETE FROM ${this.table}
`;

        if (this.wheres.length > 0) {

            sql += '\nWHERE ';

            this.wheres.forEach((where, index) => {

                if (index > 0) {

                    sql += ` ${where.boolean} `;

                }

                sql += where.sql;

            });

        }

        return {

            sql,

            values: this.values

        };

    }