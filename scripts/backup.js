#!/usr/bin/env node

/**
 * ============================================================
 * Library Of Legends 2.0
 * Database Backup Engine
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

const {
    DATABASE_FILE,
    BACKUP_DIR
} = require("../src/config/database");

/**
 * ------------------------------------------------------------
 * Zeitstempel erzeugen
 * ------------------------------------------------------------
 */

function createTimestamp() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const hour = String(now.getHours()).padStart(2, "0");

    const minute = String(now.getMinutes()).padStart(2, "0");

    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}_${hour}-${minute}-${second}`;

}

/**
 * ------------------------------------------------------------
 * Backup erstellen
 * ------------------------------------------------------------
 */

function createBackup() {

    if (!fs.existsSync(DATABASE_FILE)) {

        console.log("");

        console.log("Keine Datenbank vorhanden.");

        console.log("");

        return;

    }

    const backupName =
        `backup_${createTimestamp()}.db`;

    const destination =
        path.join(BACKUP_DIR, backupName);

    fs.copyFileSync(
        DATABASE_FILE,
        destination
    );

    console.log("");

    console.log("===================================");

    console.log("Backup erfolgreich erstellt");

    console.log("");

    console.log(destination);

    console.log("");

    console.log("===================================");

}

createBackup();