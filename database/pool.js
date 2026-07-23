const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "";

const pgPool = DATABASE_URL
    ? new Pool({
          connectionString: DATABASE_URL,
          ssl: {
              rejectUnauthorized: false,
          },
      })
    : null;

module.exports = {
    pgPool,
};