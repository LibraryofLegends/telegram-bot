const fs = require("fs");
const path = require("path");

const {
    postgres: pgPool,
    hasPostgres,
    sqlite
} = require("../connection");

const SCHEMA_DIR = path.join(__dirname, "../schema");

async function runPostgresMigration(filePath) {

    const sql = fs.readFileSync(filePath, "utf8");

    await pgPool.query(sql);

}

function runSqliteMigration(filePath) {

    const sql = fs.readFileSync(filePath, "utf8");

    sqlite.exec(sql);

}

async function runMigrations() {

    const files = fs
        .readdirSync(SCHEMA_DIR)
        .filter(file => file.endsWith(".sql"))
        .sort();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 Library Of Legends");
    console.log("🚀 Running database migrations");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const file of files) {

        const fullPath = path.join(SCHEMA_DIR, file);

        console.log(`➡ ${file}`);

        if (hasPostgres()) {
            await runPostgresMigration(fullPath);
        } else {
            runSqliteMigration(fullPath);
        }

        console.log(`✅ ${file}`);

    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Database ready");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

}

module.exports = {

    runMigrations

};