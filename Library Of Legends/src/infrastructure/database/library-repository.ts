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

Version.............: 2.1.0

Status..............: Core

Lifecycle...........: Development

Description.........

Handles saving, searching and retrieving media items
from PostgreSQL database.

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

    // =========================================================================
    // SAVE
    // =========================================================================
    public static async save(title: string, fileName: string, type: string) {

        await this.pool.query(
            `
            INSERT INTO library_items (title, file_name, type)
            VALUES ($1, $2, $3)
            `,
            [title, fileName, type]
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
    // GET ALL 🔥 (FIX)
    // =========================================================================
    public static async getAll() {

        const result = await this.pool.query(
            `
            SELECT * FROM library_items
            ORDER BY created_at DESC
            LIMIT 50
            `
        );

        return result.rows;
    }

}