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

Version.............: 7.0.0

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
- Duplicate File-ID protection
- Telegram destination storage
- Topic-ID storage
- Archive-ID storage
- Automatic database initialization
- Automatic database migration
- Safe legacy database support

The repository creates and upgrades the required
library_items table automatically.

Duplicate protection is based primarily on Telegram File-ID.

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
    // INITIALIZATION LOCK
    // =========================================================================

    private static initialized = false;

    private static initializationPromise:
        Promise<void> | null = null;

    // =========================================================================
    // INITIALIZE DATABASE
    // =========================================================================

    public static async initialize(): Promise<void> {

        if (
            this.initialized
        ) {

            return;
        }

        if (
            this.initializationPromise
        ) {

            return this.initializationPromise;
        }

        this.initializationPromise =
            this.initializeDatabase();

        try {

            await this.initializationPromise;

            this.initialized = true;

        } finally {

            this.initializationPromise =
                null;
        }
    }

    // =========================================================================
    // DATABASE SETUP
    // =========================================================================

    private static async initializeDatabase(): Promise<void> {

        /*
         * gen_random_uuid() is provided by pgcrypto.
         *
         * IF NOT EXISTS keeps this safe on every application restart.
         */

        await this.pool.query(
            `
            CREATE EXTENSION IF NOT EXISTS pgcrypto
            `
        );

        await this.pool.query(
            `
            CREATE TABLE IF NOT EXISTS library_items (

                id UUID PRIMARY KEY
                    DEFAULT gen_random_uuid(),

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

                created_at TIMESTAMPTZ
                    DEFAULT NOW()

            );
            `
        );

        // =====================================================================
        // LEGACY DATABASE MIGRATION
        // =====================================================================

        await this.ensureColumn(
            "file_id",
            "TEXT"
        );

        await this.ensureColumn(
            "genre",
            "TEXT DEFAULT 'Unbekannt'"
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

        await this.ensureColumn(
            "created_at",
            "TIMESTAMPTZ DEFAULT NOW()"
        );

        /*
         * File-ID index.
         *
         * We deliberately use a normal index instead of forcing
         * an immediate UNIQUE constraint here. This keeps old
         * databases with existing duplicate rows migratable.
         *
         * The save() method performs the actual duplicate protection.
         */

        await this.pool.query(
            `
            CREATE INDEX IF NOT EXISTS
            idx_library_items_file_id

            ON library_items(file_id)
            `
        );

        await this.pool.query(
            `
            CREATE INDEX IF NOT EXISTS
            idx_library_items_genre

            ON library_items(genre)
            `
        );

        await this.pool.query(
            `
            CREATE INDEX IF NOT EXISTS
            idx_library_items_type

            ON library_items(type)
            `
        );

        await this.pool.query(
            `
            CREATE INDEX IF NOT EXISTS
            idx_library_items_archive_id

            ON library_items(archive_id)
            `
        );

        await this.pool.query(
            `
            CREATE INDEX IF NOT EXISTS
            idx_library_items_telegram_chat_id

            ON library_items(telegram_chat_id)
            `
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

        /*
         * Column names are internal constants only.
         * They are never supplied by the user.
         */

        await this.pool.query(
            `
            ALTER TABLE library_items

            ADD COLUMN IF NOT EXISTS
            ${column}
            ${definition}
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

        const cleanTitle =
            String(
                title || ""
            ).trim();

        const cleanFileName =
            String(
                fileName || ""
            ).trim();

        const cleanFileId =
            String(
                fileId || ""
            ).trim();

        const cleanGenre =
            String(
                options.genre ||
                "Unbekannt"
            ).trim();

        // =====================================================================
        // VALIDATION
        // =====================================================================

        if (
            !cleanTitle
        ) {

            throw new Error(
                "❌ LibraryRepository: Titel fehlt."
            );
        }

        if (
            !cleanFileName
        ) {

            throw new Error(
                "❌ LibraryRepository: Dateiname fehlt."
            );
        }

        if (
            !cleanFileId
        ) {

            throw new Error(
                "❌ LibraryRepository: Telegram File-ID fehlt."
            );
        }

        // =====================================================================
        // DUPLICATE CHECK BY TELEGRAM FILE-ID
        // =====================================================================

        const existing =
            await this.findByFileId(
                cleanFileId
            );

        if (
            existing
        ) {

            console.log(
                "⚠️ Datei bereits im Archiv vorhanden."
            );

            console.log(
                `🆔 File-ID: ${cleanFileId}`
            );

            console.log(
                `🎬 Titel: ${existing.title}`
            );

            /*
             * Update the existing record instead of
             * creating another archive entry.
             */

            await this.pool.query(
                `
                UPDATE library_items

                SET
                    title = $1,

                    file_name = $2,

                    type = $3,

                    genre = $4,

                    archive_id =
                        COALESCE(
                            $5,
                            archive_id
                        ),

                    telegram_chat_id =
                        COALESCE(
                            $6,
                            telegram_chat_id
                        ),

                    topic_id =
                        COALESCE(
                            $7,
                            topic_id
                        )

                WHERE file_id = $8
                `,
                [
                    cleanTitle,

                    cleanFileName,

                    type,

                    cleanGenre,

                    options.archiveId ||
                        null,

                    options.telegramChatId ||
                        null,

                    options.topicId ||
                        null,

                    cleanFileId
                ]
            );

            console.log(
                "♻️ Vorhandener Datensatz aktualisiert."
            );

            return;
        }

        // =====================================================================
        // FILE NAME DUPLICATE CHECK
        // =====================================================================

        const existingFileName =
            await this.pool.query(
                `
                SELECT id

                FROM library_items

                WHERE file_name = $1

                LIMIT 1
                `,
                [
                    cleanFileName
                ]
            );

        if (
            existingFileName.rows.length > 0
        ) {

            console.log(
                "⚠️ Dateiname bereits vorhanden."
            );

            console.log(
                `📄 ${cleanFileName}`
            );

            /*
             * Update instead of inserting a duplicate.
             */

            await this.pool.query(
                `
                UPDATE library_items

                SET
                    title = $1,

                    type = $2,

                    file_id = $3,

                    genre = $4,

                    archive_id =
                        COALESCE(
                            $5,
                            archive_id
                        ),

                    telegram_chat_id =
                        COALESCE(
                            $6,
                            telegram_chat_id
                        ),

                    topic_id =
                        COALESCE(
                            $7,
                            topic_id
                        )

                WHERE file_name = $8
                `,
                [
                    cleanTitle,

                    type,

                    cleanFileId,

                    cleanGenre,

                    options.archiveId ||
                        null,

                    options.telegramChatId ||
                        null,

                    options.topicId ||
                        null,

                    cleanFileName
                ]
            );

            console.log(
                "♻️ Vorhandener Dateiname aktualisiert."
            );

            return;
        }

        // =====================================================================
        // INSERT
        // =====================================================================

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
            `,
            [
                cleanTitle,

                cleanFileName,

                type,

                cleanFileId,

                cleanGenre,

                options.archiveId ||
                    null,

                options.telegramChatId ||
                    null,

                options.topicId ||
                    null
            ]
        );

        console.log(
            "💾 Film/Serie in Datenbank gespeichert."
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
                        Math.min(
                            limit,
                            100
                        )
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

        const cleanQuery =
            String(
                query || ""
            ).trim();

        if (
            !cleanQuery
        ) {

            return [];
        }

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

                    OR

                    LOWER(genre)
                    LIKE LOWER($1)

                ORDER BY created_at DESC

                LIMIT 20
                `,
                [
                    `%${cleanQuery}%`
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
                [
                    id
                ]
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

                ORDER BY created_at ASC

                LIMIT 1
                `,
                [
                    fileId
                ]
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
                [
                    archiveId
                ]
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
                    `%${genre.trim()}%`,

                    Math.max(
                        1,
                        Math.min(
                            limit,
                            100
                        )
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
                        Math.min(
                            limit,
                            100
                        )
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
                        Math.min(
                            limit,
                            100
                        )
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

                ORDER BY
                    views DESC,

                    created_at DESC

                LIMIT $1
                `,
                [
                    Math.max(
                        1,
                        Math.min(
                            limit,
                            100
                        )
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

            SET
                views =
                    COALESCE(
                        views,
                        0
                    ) + 1

            WHERE id = $1
            `,
            [
                id
            ]
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

                SET
                    is_favorite =
                        NOT COALESCE(
                            is_favorite,
                            FALSE
                        )

                WHERE id = $1

                RETURNING is_favorite
                `,
                [
                    id
                ]
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
                        Math.min(
                            limit,
                            100
                        )
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

        if (
            type
        ) {

            const result =
                await this.pool.query(
                    `
                    SELECT
                        COUNT(*)::integer
                        AS count

                    FROM library_items

                    WHERE type = $1
                    `,
                    [
                        type
                    ]
                );

            return (
                result.rows[0]?.count ||
                0
            );
        }

        const result =
            await this.pool.query(
                `
                SELECT
                    COUNT(*)::integer
                    AS count

                FROM library_items
                `
            );

        return (
            result.rows[0]?.count ||
            0
        );
    }

    // =========================================================================
    // UPDATE TELEGRAM ROUTING
    // =========================================================================

    public static async updateTelegramRouting(
        fileId: string,
        telegramChatId?: string,
        topicId?: number
    ): Promise<void> {

        await this.initialize();

        await this.pool.query(
            `
            UPDATE library_items

            SET

                telegram_chat_id =
                    COALESCE(
                        $1,
                        telegram_chat_id
                    ),

                topic_id =
                    COALESCE(
                        $2,
                        topic_id
                    )

            WHERE file_id = $3
            `,
            [
                telegramChatId ||
                    null,

                topicId ||
                    null,

                fileId
            ]
        );
    }

    // =========================================================================
    // UPDATE ARCHIVE ID
    // =========================================================================

    public static async updateArchiveId(
        fileId: string,
        archiveId: string
    ): Promise<void> {

        await this.initialize();

        await this.pool.query(
            `
            UPDATE library_items

            SET archive_id = $1

            WHERE file_id = $2
            `,
            [
                archiveId,

                fileId
            ]
        );
    }

    // =========================================================================
    // DELETE BY FILE ID
    // =========================================================================

    public static async deleteByFileId(
        fileId: string
    ): Promise<boolean> {

        await this.initialize();

        const result =
            await this.pool.query(
                `
                DELETE FROM library_items

                WHERE file_id = $1

                RETURNING id
                `,
                [
                    fileId
                ]
            );

        return (
            result.rowCount !== null &&
            result.rowCount > 0
        );
    }

    // =========================================================================
    // CLOSE DATABASE
    // =========================================================================

    public static async close(): Promise<void> {

        await this.pool.end();

        this.initialized =
            false;

        console.log(
            "💾 LibraryRepository Verbindung geschlossen."
        );
    }
}