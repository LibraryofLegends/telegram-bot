/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryRepository

Architecture Layer..: Infrastructure

Module..............: Database

Module ID...........: LOL-MOD-DB-0001

LOL-ID..............: LOL-DB-0001

File................: library-repository.ts

Location............
Library Of Legends/src/infrastructure/database/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles persistent storage of library items and ID generation
using PostgreSQL (Supabase compatible).

===============================================================================
*/

import { Pool } from "pg";

/**
 * Library Types
 */
export type LibraryType = "MOVIE" | "SERIES";

/**
 * Database Pool
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * Library Repository
 */
export class LibraryRepository {

    /**
     * Get next Library ID from DB
     */
    public static async getNextId(type: LibraryType): Promise<string> {

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            // =========================================================================
            // LOCK ROW
            // =========================================================================

            const res = await client.query(
                `SELECT counter FROM library_counters WHERE type = $1 FOR UPDATE`,
                [type]
            );

            let counter = 1;

            if (res.rows.length > 0) {
                counter = res.rows[0].counter + 1;

                await client.query(
                    `UPDATE library_counters SET counter = $1 WHERE type = $2`,
                    [counter, type]
                );

            } else {

                await client.query(
                    `INSERT INTO library_counters (type, counter) VALUES ($1, $2)`,
                    [type, counter]
                );

            }

            await client.query("COMMIT");

            return this.format(type, counter);

        } catch (error) {

            await client.query("ROLLBACK");
            throw error;

        } finally {

            client.release();

        }

    }

    /**
     * Format ID
     */
    private static format(type: LibraryType, num: number): string {

        const prefix = type === "MOVIE" ? "MOV" : "SER";

        return `LIB-${prefix}-${num.toString().padStart(4, "0")}`;

    }

}