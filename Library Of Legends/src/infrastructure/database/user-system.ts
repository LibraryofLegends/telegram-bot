/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: UserSystem

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-USER-0001

LOL-ID..............: LOL-DB-USER-0001

File................: user-system.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

User management system with Premium logic.

===============================================================================
*/

import Database from "better-sqlite3";

// =========================================================================
// TYPES
// =========================================================================

export interface UserEntity {
    id: number;
    telegram_id: number;
    username?: string;
    is_premium: number;        // 0 | 1
    daily_requests: number;
    last_request_date?: string;
}

// =========================================================================
// USER SYSTEM
// =========================================================================

export class UserSystem {

    private static db = new Database("library.db");

    // =========================================================================
    // GET USER
    // =========================================================================

    public static getUser(
        telegramId: number
    ): UserEntity {

        const row = this.db
            .prepare(`
                SELECT *
                FROM users
                WHERE telegram_id = ?
            `)
            .get(telegramId) as UserEntity | undefined;

        // 👇 Falls User nicht existiert → erstellen
        if (!row) {

            this.db
                .prepare(`
                    INSERT INTO users (
                        telegram_id,
                        is_premium,
                        daily_requests
                    )
                    VALUES (?, 0, 0)
                `)
                .run(telegramId);

            return {
                id: 0,
                telegram_id: telegramId,
                is_premium: 0,
                daily_requests: 0
            };
        }

        return row;
    }

    // =========================================================================
    // IS PREMIUM
    // =========================================================================

    public static isPremium(
        telegramId: number
    ): boolean {

        const user =
            this.getUser(telegramId);

        return user.is_premium === 1;
    }

    // =========================================================================
    // CAN REQUEST (LIMIT SYSTEM)
    // =========================================================================

    public static canRequest(
        telegramId: number
    ): boolean {

        const user =
            this.getUser(telegramId);

        // 👑 Premium → unlimited
        if (user.is_premium === 1) {
            return true;
        }

        const today =
            new Date().toISOString().slice(0, 10);

        // Reset daily counter
        if (user.last_request_date !== today) {

            this.db.prepare(`
                UPDATE users
                SET daily_requests = 0,
                    last_request_date = ?
                WHERE telegram_id = ?
            `).run(today, telegramId);

            return true;
        }

        // Limit (FREE USER)
        return user.daily_requests < 3;
    }

    // =========================================================================
    // INCREMENT REQUEST
    // =========================================================================

    public static addRequest(
        telegramId: number
    ): void {

        const today =
            new Date().toISOString().slice(0, 10);

        this.db.prepare(`
            UPDATE users
            SET daily_requests = daily_requests + 1,
                last_request_date = ?
            WHERE telegram_id = ?
        `).run(today, telegramId);
    }

    // =========================================================================
    // SET PREMIUM
    // =========================================================================

    public static setPremium(
        telegramId: number,
        value: boolean
    ): void {

        this.db.prepare(`
            UPDATE users
            SET is_premium = ?
            WHERE telegram_id = ?
        `).run(value ? 1 : 0, telegramId);
    }
}