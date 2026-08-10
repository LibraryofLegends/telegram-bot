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

Version.............: 6.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Full PostgreSQL repository for the Library Of Legends
automatic media archive.

Responsibilities:

- Save movies and series
- Search archive
- Pagination
- Genre filtering
- Favorites
- Trending
- View tracking
- File-ID storage
- Telegram destination storage
- Topic-ID storage
- Archive-ID storage
- Automatic database initialization

The repository creates the required library_items table
automatically when the application starts.

===============================================================================
*/

import { Pool } from "pg";

/**
 * Supported media types.
 */
export type LibraryMediaType =
    | "MOVIE"
    | "SERIES";

/**
 * Database library item.
 */
export interface LibraryRepositoryItem {

    id: string;

    title: string;

    file_name: string;

    type: LibraryMediaType;

    file_id: string;

    genre: string;

    archive_id?: string;

    telegram_chat_id?: string;

    topic_id?: number;

    views: number;

    is_favorite: boolean;

    created_at: Date;
}

/**
 * Library Repository
 */
export class LibraryRepository {

    // =========================================================================
    // DATABASE CONNECTION
    // =========================================================================

    private static readonly pool =
        new Pool({
            connectionString:
                process.env.DATABASE_URL,

            ssl: {
                rejectUnauthorized: false
            }
        });

    // =========================================================================
    // INITIALIZE DATABASE
    // =========================================================================

    public static async initialize(): Promise<void> {

        await this.pool.query(
            `
            CREATE TABLE IF NOT EXISTS library_items (

                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                title TEXT NOT NULL,

                file_name TEXT NOT NULL UNIQUE,

                type TEXT NOT NULL,

                file_id TEXT NOT NULL,

                genre TEXT DEFAULT 'Unbekannt',

                archive_id TEXT,

                telegram_chat_id TEXT,

                topic_id INTEGER,

                views INTEGER DEFAULT 0,

                is_favorite BOOLEAN DEFAULT FALSE,

                created_at TIMESTAMPTZ DEFAULT NOW()

            );
            `
        );

        await this.ensureColumn(
            "archive_id",
            "TEXT"
        );

        await this.ensureColumn(
            "telegram_chat_id",
            "TEXT"
        );

        await this.ensureColumn(
            "topic_id",
            "INTEGER"
        );

        await this.ensureColumn(
            "views",
            "INTEGER DEFAULT 0"
        );

        await this.ensureColumn(
            "is_favorite",
            "BOOLEAN DEFAULT FALSE"
        );

        console.log(
            "💾 LibraryRepository initialisiert."
        );
    }

    // =========================================================================
    // ENSURE COLUMN
    // =========================================================================

    private static async ensureColumn(
        column: string,
        definition: string
    ): Promise<void> {

        await this.pool.query(
            `
            ALTER TABLE library_items
            ADD COLUMN IF NOT EXISTS ${column} ${definition}
            `
        );
    }

    // =========================================================================
    // SAVE
    // =========================================================================

    public static async save(
        title: string,
        fileName: string,
        type: LibraryMediaType,
        fileId: string,
        options: {
            genre?: string;
            archiveId?: string;
            telegramChatId?: string;
            topicId?: number;
        } = {}
    ): Promise<void> {

        await this.initialize();

        await this.pool.query(
            `
            INSERT INTO library_items (
                title,
                file_name,
                type,
                file_id,
                genre,
                archive_id,
                telegram_chat_id,
                topic_id
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )

            ON CONFLICT (file_name)
            DO UPDATE SET

                title = EXCLUDED.title,

                type = EXCLUDED.type,

                file_id = EXCLUDED.file_id,

                genre = EXCLUDED.genre,

                archive_id = EXCLUDED.archive_id,

                telegram_chat_id =
                    EXCLUDED.telegram_chat_id,

                topic_id =
                    EXCLUDED.topic_id
            `,
            [
                title,

                fileName,

                type,

                fileId,

                options.genre ||
                    "Unbekannt",

                options.archiveId ||
                    null,

                options.telegramChatId ||
                    null,

                options.topicId ||
                    null
            ]
        );
    }

    // =========================================================================
    // GET ALL
    // =========================================================================

    public static async getAll(
        limit = 10,
        offset = 0
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                ORDER BY created_at DESC

                LIMIT $1
                OFFSET $2
                `,
                [
                    Math.max(
                        1,
                        Math.min(limit, 100)
                    ),

                    Math.max(
                        0,
                        offset
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // SEARCH
    // =========================================================================

    public static async search(
        query: string
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE
                    LOWER(title)
                    LIKE LOWER($1)

                    OR

                    LOWER(file_name)
                    LIKE LOWER($1)

                ORDER BY created_at DESC

                LIMIT 20
                `,
                [
                    `%${query.trim()}%`
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // FIND BY ID
    // =========================================================================

    public static async findById(
        id: string
    ): Promise<LibraryRepositoryItem | null> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE id = $1

                LIMIT 1
                `,
                [id]
            );

        return (
            result.rows[0] ||
            null
        );
    }

    // =========================================================================
    // FIND BY FILE ID
    // =========================================================================

    public static async findByFileId(
        fileId: string
    ): Promise<LibraryRepositoryItem | null> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE file_id = $1

                LIMIT 1
                `,
                [fileId]
            );

        return (
            result.rows[0] ||
            null
        );
    }

    // =========================================================================
    // FIND BY ARCHIVE ID
    // =========================================================================

    public static async findByArchiveId(
        archiveId: string
    ): Promise<LibraryRepositoryItem | null> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE archive_id = $1

                LIMIT 1
                `,
                [archiveId]
            );

        return (
            result.rows[0] ||
            null
        );
    }

    // =========================================================================
    // GET BY GENRE
    // =========================================================================

    public static async getByGenre(
        genre: string,
        limit = 20,
        offset = 0
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE
                    LOWER(genre)
                    LIKE LOWER($1)

                ORDER BY created_at DESC

                LIMIT $2
                OFFSET $3
                `,
                [
                    `%${genre}%`,

                    Math.max(
                        1,
                        Math.min(limit, 100)
                    ),

                    Math.max(
                        0,
                        offset
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // GET MOVIES
    // =========================================================================

    public static async getMovies(
        limit = 20,
        offset = 0
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE type = 'MOVIE'

                ORDER BY created_at DESC

                LIMIT $1
                OFFSET $2
                `,
                [
                    Math.max(
                        1,
                        Math.min(limit, 100)
                    ),

                    Math.max(
                        0,
                        offset
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // GET SERIES
    // =========================================================================

    public static async getSeries(
        limit = 20,
        offset = 0
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE type = 'SERIES'

                ORDER BY created_at DESC

                LIMIT $1
                OFFSET $2
                `,
                [
                    Math.max(
                        1,
                        Math.min(limit, 100)
                    ),

                    Math.max(
                        0,
                        offset
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // TRENDING
    // =========================================================================

    public static async getTrending(
        limit = 10
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                ORDER BY views DESC,
                         created_at DESC

                LIMIT $1
                `,
                [
                    Math.max(
                        1,
                        Math.min(limit, 100)
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // INCREASE VIEWS
    // =========================================================================

    public static async increaseViews(
        id: string
    ): Promise<void> {

        await this.initialize();

        await this.pool.query(
            `
            UPDATE library_items

            SET views =
                COALESCE(views, 0) + 1

            WHERE id = $1
            `,
            [id]
        );
    }

    // =========================================================================
    // TOGGLE FAVORITE
    // =========================================================================

    public static async toggleFavorite(
        id: string
    ): Promise<boolean> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                UPDATE library_items

                SET is_favorite =
                    NOT COALESCE(
                        is_favorite,
                        FALSE
                    )

                WHERE id = $1

                RETURNING is_favorite
                `,
                [id]
            );

        return (
            result.rows[0]?.is_favorite ??
            false
        );
    }

    // =========================================================================
    // FAVORITES
    // =========================================================================

    public static async getFavorites(
        limit = 20
    ): Promise<LibraryRepositoryItem[]> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                SELECT *
                FROM library_items

                WHERE is_favorite = TRUE

                ORDER BY created_at DESC

                LIMIT $1
                `,
                [
                    Math.max(
                        1,
                        Math.min(limit, 100)
                    )
                ]
            );

        return result.rows;
    }

    // =========================================================================
    // COUNT
    // =========================================================================

    public static async count(
        type?: LibraryMediaType
    ): Promise<number> {

        await this.initialize();

        if (type) {

            const result =
                await this.pool.query(
                    `
                    SELECT COUNT(*)::integer AS count

                    FROM library_items

                    WHERE type = $1
                    `,
                    [type]
                );

            return result.rows[0]?.count || 0;
        }

        const result =
            await this.pool.query(
                `
                SELECT COUNT(*)::integer AS count

                FROM library_items
                `
            );

        return result.rows[0]?.count || 0;
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    public static async close(): Promise<void> {

        await this.pool.end();

        console.log(
            "💾 LibraryRepository Verbindung geschlossen."
        );
    }
}