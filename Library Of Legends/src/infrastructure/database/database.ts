/*
===============================================================================
DATABASE CORE
===============================================================================
*/

import Database from "better-sqlite3";

export const db = new Database("library.db");

console.log("💾 SQLite Datenbank geladen");