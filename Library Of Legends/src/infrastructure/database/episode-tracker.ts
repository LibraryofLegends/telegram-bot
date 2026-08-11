/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EpisodeTracker

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0001

LOL-ID..............: LOL-DB-EP-0001

File................: episode-tracker.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Tracks uploaded episodes and prevents duplicates.

===============================================================================
*/

import Database from "better-sqlite3";

const db = new Database("library.db");

db.exec(`
CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    series TEXT,
    season INTEGER,
    episode INTEGER,
    file_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export class EpisodeTracker {

    public static exists(series: string, season: number, episode: number): boolean {

        const row = db.prepare(`
            SELECT 1 FROM episodes
            WHERE series = ?
            AND season = ?
            AND episode = ?
        `).get(series, season, episode);

        return !!row;
    }

    public static add(series: string, season: number, episode: number, fileId: string) {

        db.prepare(`
            INSERT INTO episodes (series, season, episode, file_id)
            VALUES (?, ?, ?, ?)
        `).run(series, season, episode, fileId);
    }
}