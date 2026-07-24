const {
    postgres: pgPool,
    hasPostgres,
    sqlite
} = require("./connection");

async function query(sql, params = []) {

    if (hasPostgres()) {
        return await pgPool.query(sql, params);
    }

    return sqlite.prepare(sql).all(...params);

}

async function get(sql, params = []) {

    if (hasPostgres()) {

        const result =
            await pgPool.query(sql, params);

        return result.rows[0] || null;

    }

    return sqlite.prepare(sql).get(...params);

}

async function run(sql, params = []) {

    if (hasPostgres()) {
        return await pgPool.query(sql, params);
    }

    return sqlite.prepare(sql).run(...params);

}

async function exec(sql) {

    if (hasPostgres()) {
        return await pgPool.query(sql);
    }

    return sqlite.exec(sql);

}

module.exports = {

    query,
    get,
    run,
    exec

};