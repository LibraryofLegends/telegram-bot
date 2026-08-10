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

Version.............: 5.0.0

Description.........

Full database logic:
- Save
- Search
- Pagination
- Genres
- Favorites
- Trending

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

    public static async save(title: string, fileName: string, type: string, fileId: string) {

        const genre = this.detectGenre(title);

        await this.pool.query(
            `
            INSERT INTO library_items (title, file_name, type, file_id, genre)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (file_name) DO NOTHING
            `,
            [title, fileName, type, fileId, genre]
        );
    }

    // =========================================================================
    // GENRE DETECTION (AUTO 🔥)
    // =========================================================================

    private static detectGenre(title: string): string {

        const t = title.toLowerCase();

        if (t.includes("war") || t.includes("battle")) return "Action";
        if (t.includes("dead") || t.includes("evil")) return "Horror";
        if (t.includes("space") || t.includes("star")) return "Sci-Fi";
        if (t.includes("love")) return "Romance";

        return "Unknown";
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static async getAll(limit = 10, offset = 0) {

        const result = await this.pool.query(
            `SELECT * FROM library_items
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        return result.rows;
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(query: string) {

        const result = await this.pool.query(
            `SELECT * FROM library_items
             WHERE LOWER(title) LIKE LOWER($1)
             LIMIT 10`,
            [`%${query}%`]
        );

        return result.rows;
    }

    // =========================================================================
    // TRENDING 🔥
    // =========================================================================

    public static async getTrending() {

        const result = await this.pool.query(
            `SELECT * FROM library_items
             ORDER BY views DESC
             LIMIT 10`
        );

        return result.rows;
    }

    // =========================================================================
    // INCREASE VIEWS
    // =========================================================================

    public static async increaseViews(id: string) {

        await this.pool.query(
            `UPDATE library_items
             SET views = views + 1
             WHERE id = $1`,
            [id]
        );
    }

    // =========================================================================
    // FAVORITE TOGGLE
    // =========================================================================

    public static async toggleFavorite(id: string) {

        await this.pool.query(
            `
            UPDATE library_items
            SET is_favorite = NOT is_favorite
            WHERE id = $1
            `,
            [id]
        );
    }

    // =========================================================================
    // FAVORITES LIST
    // =========================================================================

    public static async getFavorites() {

        const result = await this.pool.query(
            `SELECT * FROM library_items
             WHERE is_favorite = true`
        );

        return result.rows;
    }

}