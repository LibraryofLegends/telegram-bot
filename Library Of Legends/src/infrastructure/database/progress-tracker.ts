/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProgressTracker

===============================================================================
*/

import Database from "better-sqlite3";

const db = new Database("library.db");

db.exec(`
CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER,
    series TEXT,
    season INTEGER,
    episode INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export class ProgressTracker {

    public static setProgress(
        userId: number,
        series: string,
        season: number,
        episode: number
    ) {

        db.prepare(`
            INSERT INTO progress (user_id, series, season, episode)
            VALUES (?, ?, ?, ?)
        `).run(userId, series, season, episode);
    }

    public static getContinue(userId: number) {

        return db.prepare(`
            SELECT * FROM progress
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT 10
        `).all(userId);
    }
}