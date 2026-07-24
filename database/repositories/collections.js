const {
    postgres: pgPool,
    hasPostgres,
    sqlite
} = require("../connection");

const db = sqlite;

// ======================================================
// HELPERS
// ======================================================

function createSlug(name) {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ======================================================
// READ
// ======================================================

async function getCollection(tmdbCollectionId) {

    if (hasPostgres()) {

        const result = await pgPool.query(
            `
            SELECT *
            FROM collections
            WHERE tmdb_collection_id = $1
            LIMIT 1
            `,
            [tmdbCollectionId]
        );

        return result.rows[0] || null;
    }

    return db.prepare(`
        SELECT *
        FROM collections
        WHERE tmdb_collection_id = ?
    `).get(tmdbCollectionId);
}

// Kompatibilität für alten Code
const getCollectionById = getCollection;

// ======================================================
// WRITE
// ======================================================

async function saveCollection(data) {

    if (hasPostgres()) {

        return await pgPool.query(
            `
            INSERT INTO collections
            (
                collection_name,
                tmdb_collection_id,
                topic_id,
                poster_url
            )
            VALUES ($1,$2,$3,$4)
            ON CONFLICT (tmdb_collection_id)
            DO UPDATE SET
                collection_name = EXCLUDED.collection_name,
                topic_id = EXCLUDED.topic_id,
                poster_url = EXCLUDED.poster_url
            `,
            [
                data.collectionName,
                data.tmdbCollectionId,
                data.topicId,
                data.posterUrl
            ]
        );
    }

    return db.prepare(`
        INSERT INTO collections
        (
            collection_name,
            tmdb_collection_id,
            topic_id,
            poster_url
        )
        VALUES (?,?,?,?)
        ON CONFLICT(tmdb_collection_id)
        DO UPDATE SET
            collection_name = excluded.collection_name,
            topic_id = excluded.topic_id,
            poster_url = excluded.poster_url
    `).run(
        data.collectionName,
        data.tmdbCollectionId,
        data.topicId,
        data.posterUrl
    );
}

async function saveCollectionHubMessageId(
    tmdbCollectionId,
    messageId
) {

    if (hasPostgres()) {

        return await pgPool.query(
            `
            UPDATE collections
            SET hub_message_id = $1
            WHERE tmdb_collection_id = $2
            `,
            [
                messageId,
                tmdbCollectionId
            ]
        );
    }

    return db.prepare(`
        UPDATE collections
        SET hub_message_id = ?
        WHERE tmdb_collection_id = ?
    `).run(
        messageId,
        tmdbCollectionId
    );
}

// ======================================================
// TMDB COLLECTIONS
// ======================================================

async function findOrCreateCollection(pgPoolInstance, collection) {

    if (!pgPoolInstance || !collection) {
        return null;
    }

    if (collection.tmdbId) {

        const existing = await pgPoolInstance.query(
            `
            SELECT *
            FROM collections
            WHERE tmdb_collection_id = $1
            LIMIT 1
            `,
            [
                collection.tmdbId
            ]
        );

        if (existing.rows.length) {
            return existing.rows[0];
        }
    }

    const slug =
        createSlug(collection.name);

    const inserted =
        await pgPoolInstance.query(
            `
            INSERT INTO collections
            (
                tmdb_collection_id,
                name,
                slug,
                overview,
                poster_path,
                backdrop_path
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                collection.tmdbId || null,
                collection.name,
                slug,
                collection.overview || null,
                collection.posterPath || null,
                collection.backdropPath || null
            ]
        );

    return inserted.rows[0];
}

// ======================================================
// RELATIONS
// ======================================================

async function assignMovieToCollection(
    pgPoolInstance,
    movieId,
    collectionId,
    position = null
) {

    if (
        !pgPoolInstance ||
        !movieId ||
        !collectionId
    ) {
        return;
    }

    await pgPoolInstance.query(
        `
        INSERT INTO movie_collections
        (
            movie_id,
            collection_id,
            position
        )
        VALUES ($1,$2,$3)
        ON CONFLICT (movie_id, collection_id)
        DO NOTHING
        `,
        [
            movieId,
            collectionId,
            position
        ]
    );

    await pgPoolInstance.query(
        `
        UPDATE collections
        SET
            movie_count = (
                SELECT COUNT(*)
                FROM movie_collections
                WHERE collection_id = $1
            ),
            updated_at = NOW()
        WHERE id = $1
        `,
        [
            collectionId
        ]
    );
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    // Helper
    createSlug,

    // Read
    getCollection,
    getCollectionById,

    // Write
    saveCollection,
    saveCollectionHubMessageId,

    // TMDB
    findOrCreateCollection,

    // Relations
    assignMovieToCollection

};