/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Database

Architecture Layer..: Infrastructure

Module..............: Database Core

Module ID...........: LOL-MOD-DB-0001

LOL-ID..............: LOL-DB-CORE-0001

File................: database.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central SQLite database instance for Library Of Legends.

Responsibilities:

- Initialize SQLite connection
- Provide shared database instance
- Ensure consistent DB access across modules

Database:

SQLite (better-sqlite3)

===============================================================================
*/

import Database from "better-sqlite3";

/**
 * Database instance.
 */
export const db = new Database("library.db");

console.log("💾 SQLite Datenbank initialisiert");