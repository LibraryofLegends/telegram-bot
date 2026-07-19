const path = require("path");
const Database = require("better-sqlite3");
const { Pool } = require("pg");

// =============================
// SQLITE
// =============================

const sqlite = new Database(
  path.join(__dirname, "..", "library.db")
);

sqlite.pragma("journal_mode = WAL");

// =============================
// POSTGRES / SUPABASE
// =============================

const DATABASE_URL = process.env.DATABASE_URL || "";

const postgres = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : null;

// =============================
// EXPORTS
// =============================

module.exports = {
  sqlite,
  postgres,

  hasPostgres() {
    return postgres !== null;
  }
};