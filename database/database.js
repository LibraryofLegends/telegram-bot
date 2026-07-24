// ======================================================
// Library Of Legends 2.0
// File: database.js
// Module: Database
// Description: Unified database access layer
// Author: Thomas Lorenz
// Version: 2.0
// ======================================================

// ======================================================
// IMPORTS
// ======================================================

const {
    postgres: pgPool,
    hasPostgres,
    sqlite
} = require("./connection");

// ======================================================
// QUERY
// ======================================================

async function query(sql, params = []) {

    if (hasPostgres()) {
        return await pgPool.query(sql, params);
    }

    return sqlite.prepare(sql).all(...params);

}

// ======================================================
// GET
// ======================================================

async function get(sql, params = []) {

    if (hasPostgres()) {

        const result = await pgPool.query(sql, params);

        return result.rows[0] || null;

    }

    return sqlite.prepare(sql).get(...params);

}

// ======================================================
// RUN
// ======================================================

async function run(sql, params = []) {

    if (hasPostgres()) {
        return await pgPool.query(sql, params);
    }

    return sqlite.prepare(sql).run(...params);

}

// ======================================================
// EXEC
// ======================================================

async function exec(sql) {

    if (hasPostgres()) {
        return await pgPool.query(sql);
    }

    return sqlite.exec(sql);

}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    query,
    get,
    run,
    exec

};