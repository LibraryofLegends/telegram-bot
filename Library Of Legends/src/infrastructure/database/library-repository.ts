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

Version.............: 4.0.0

Status..............: CORE

Lifecycle...........: Production

Description.........

Handles saving, searching and retrieving media in database.
Includes pagination support.

===============================================================================
*/

import { Pool } from "pg";

export class LibraryRepository {

    private static pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // =========================================================================
    // SAVE
    // =========================================================================

    public static async save(
        title: string,
        fileName: string,
        type: string,
        fileId: string
    ) {

        await this.pool.query(
            `
            INSERT INTO library_items (title, file_name, type, file_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (file_name) DO NOTHING
            `,
            [title, fileName, type, fileId]
        );
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(query: string) {

        const result = await this.pool.query(
            `
            SELECT * FROM library_items
            WHERE LOWER(title) LIKE LOWER($1)
            ORDER BY created_at DESC
            LIMIT 10
            `,
            [`%${query}%`]
        );

        return result.rows;
    }

    // =========================================================================
    // GET ALL (PAGINATION 🔥)
    // =========================================================================

    public static async getAll(limit: number = 10, offset: number = 0) {

        const result = await this.pool.query(
            `
            SELECT * FROM library_items
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );

        return result.rows;
    }

}