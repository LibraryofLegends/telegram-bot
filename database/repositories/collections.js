function createSlug(name) {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function findOrCreateCollection(pgPool, collection) {
    if (!pgPool || !collection) {
        return null;
    }

    // Nach TMDB-ID suchen
    if (collection.tmdbId) {
        const existing = await pgPool.query(
            `
            SELECT *
            FROM collections
            WHERE tmdb_collection_id = $1
            LIMIT 1
            `,
            [collection.tmdbId]
        );

        if (existing.rows.length) {
            return existing.rows[0];
        }
    }

    const slug = createSlug(collection.name);

    const inserted = await pgPool.query(
        `
        INSERT INTO collections (
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
            collection.backdropPath || null,
        ]
    );

    return inserted.rows[0];
}

async function assignMovieToCollection(
    pgPool,
    movieId,
    collectionId,
    position = null
) {
    if (!pgPool || !movieId || !collectionId) {
        return;
    }

    await pgPool.query(
        `
        INSERT INTO movie_collections (
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
            position,
        ]
    );

    await pgPool.query(
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
        [collectionId]
    );
}

module.exports = {
    createSlug,
    findOrCreateCollection,
    assignMovieToCollection,
};