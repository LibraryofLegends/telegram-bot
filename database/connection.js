const path = require("path");
const Database = require("better-sqlite3");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "";

const sqlite = new Database(
    path.join(__dirname, "..", "library.db")
);

sqlite.pragma("journal_mode = WAL");

const postgres = DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : null;

module.exports = {
    sqlite,
    postgres,
    hasPostgres() {
        return postgres !== null;
    }
};