/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: UserSystem

===============================================================================
*/

import Database from "better-sqlite3";

const db = new Database("library.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    is_premium INTEGER DEFAULT 0,
    daily_requests INTEGER DEFAULT 0,
    last_request DATE
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER,
    item_id TEXT
);
`);

export class UserSystem {

    public static canRequest(userId: number): boolean {

        const user = db.prepare(`
            SELECT * FROM users WHERE id = ?
        `).get(userId);

        if (!user) return true;

        if (user.is_premium) return true;

        return user.daily_requests < 3;
    }

    public static addRequest(userId: number) {

        db.prepare(`
            INSERT INTO users (id, daily_requests)
            VALUES (?, 1)
            ON CONFLICT(id) DO UPDATE SET daily_requests = daily_requests + 1
        `).run(userId);
    }

    public static addFavorite(userId: number, itemId: string) {

        db.prepare(`
            INSERT INTO favorites (user_id, item_id)
            VALUES (?, ?)
        `).run(userId, itemId);
    }

    public static getFavorites(userId: number) {

        return db.prepare(`
            SELECT item_id FROM favorites WHERE user_id = ?
        `).all(userId);
    }
}