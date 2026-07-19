const { hasPostgres } = require("./connection");
const { db } = require("./sqlite");
const { postgres: pgPool } = require("./connection");

/**
 * Führt automatisch SQL gegen PostgreSQL oder SQLite aus.
 */
async function query(pgSql, sqliteSql, params = []) {
  if (hasPostgres()) {
    return await pgPool.query(pgSql, params);
  }

  const sql = sqliteSql || pgSql;

  const cmd = sql.trim().toUpperCase();

  if (cmd.startsWith("SELECT")) {
    return db.prepare(sql).all(...params);
  }

  return db.prepare(sql).run(...params);
}

module.exports = {
  query,
  db,
  pgPool,
  hasPostgres
};