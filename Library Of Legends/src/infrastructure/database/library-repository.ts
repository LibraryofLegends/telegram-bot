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

Handles persistence of library items (save + search).
Uses PostgreSQL via pg Pool.

===============================================================================
*/

import { Pool } from "pg";

/**
 * Library Repository
 */
export class LibraryRepository {

    private static pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    /**
     * Save media item to database
     */
    public static async save(
        title: string,
        fileName: string,
        type: string
    ): Promise<void> {

        await this.pool.query(
            `
            INSERT INTO library_items (title, file_name, type)
            VALUES ($1, $2, $3)
            `,
            [title, fileName, type]
        );
    }

    /**
     * Search media items
     */
    public static async search(query: string): Promise<any[]> {

        const result = await this.pool.query(
            `
            SELECT *
            FROM library_items
            WHERE LOWER(title) LIKE LOWER($1)
            ORDER BY created_at DESC
            LIMIT 10
            `,
            [`%${query}%`]
        );

        return result.rows;
    }

}