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

Version.............: 5.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Full database logic for the Library Of Legends media library.

Responsibilities:
- Save media items
- Search media items
- Retrieve all media items
- Pagination support
- Automatic genre detection
- Trending media
- View tracking
- Favorite management

===============================================================================
*/

import { Pool } from "pg";

/**
 * Library Repository
 */
export class LibraryRepository {

    // =========================================================================
    // DATABASE CONNECTION
    // =========================================================================

    private static pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // =========================================================================
    // SAVE
    // =========================================================================

    public static async save(
        title: string,
        fileName: string,
        type: string,
        fileId: string
    ): Promise<void> {

        const genre = this.detectGenre(title);

        await this.pool.query(
            `
            INSERT INTO library_items (
                title,
                file_name,
                type,
                file_id,
                genre
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (file_name) DO NOTHING
            `,
            [
                title,
                fileName,
                type,
                fileId,
                genre
            ]
        );
    }

    // =========================================================================
    // GENRE DETECTION
    // =========================================================================

    private static detectGenre(title: string): string {

        const normalizedTitle = title.toLowerCase();

        if (
            normalizedTitle.includes("war") ||
            normalizedTitle.includes("battle")
        ) {
            return "Action";
        }

        if (
            normalizedTitle.includes("dead") ||
            normalizedTitle.includes("evil")
        ) {
            return "Horror";
        }

        if (
            normalizedTitle.includes("space") ||
            normalizedTitle.includes("star")
        ) {
            return "Sci-Fi";
        }

        if (
            normalizedTitle.includes("love")
        ) {
            return "Romance";
        }

        return "Unknown";
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static async getAll(
        limit: number = 10,
        offset: number = 0
    ) {

        const result = await this.pool.query(
            `
            SELECT *
            FROM library_items
            ORDER BY created_at DESC
            LIMIT $1
            OFFSET $2
            `,
            [
                limit,
                offset
            ]
        );

        return result.rows;
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(query: string) {

        const result = await this.pool.query(
            `
            SELECT *
            FROM library_items
            WHERE LOWER(title) LIKE LOWER($1)
            ORDER BY created_at DESC
            LIMIT 10
            `,
            [
                `%${query}%`
            ]
        );

        return result.rows;
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    public static async getTrending() {

        const result = await this.pool.query(
            `
            SELECT *
            FROM library_items
            ORDER BY views DESC, created_at DESC
            LIMIT 10
            `
        );

        return result.rows;
    }

    // =========================================================================
    // INCREASE VIEWS
    // =========================================================================

    public static async increaseViews(
        id: string
    ): Promise<void> {

        await this.pool.query(
            `
            UPDATE library_items
            SET views = views + 1
            WHERE id = $1
            `,
            [
                id
            ]
        );
    }

    // =========================================================================
    // FAVORITE TOGGLE
    // =========================================================================

    public static async toggleFavorite(
        id: string
    ): Promise<void> {

        await this.pool.query(
            `
            UPDATE library_items
            SET is_favorite = NOT is_favorite
            WHERE id = $1
            `,
            [
                id
            ]
        );
    }

    // =========================================================================
    // FAVORITES LIST
    // =========================================================================

    public static async getFavorites() {

        const result = await this.pool.query(
            `
            SELECT *
            FROM library_items
            WHERE is_favorite = true
            ORDER BY created_at DESC
            `
        );

        return result.rows;
    }

}