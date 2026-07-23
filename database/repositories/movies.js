async function findOrCreateMovie(
    pgPool,
    parsed,
    tmdbData,
    stagingMessageId = null
) {
    if (!pgPool)
        return null;

    if (!tmdbData)
        return null;

    let result = await pgPool.query(
        `
        SELECT *
        FROM movies
        WHERE tmdb_id=$1
        LIMIT 1
        `,
        [
            tmdbData.tmdbId
        ]
    );

    if (result.rows.length) {
        return result.rows[0];
    }

    result = await pgPool.query(
        `
        INSERT INTO movies(
            title,
            original_title,
            year,
            tmdb_id,
            imdb_id,
            overview,
            poster_path,
            backdrop_path,
            vote_average,
            vote_count,
            runtime,
            genres,
            quality,
            source,
            codec,
            audio,
            staging_message_id
        )
        VALUES(
            $1,$2,$3,
            $4,$5,
            $6,
            $7,$8,
            $9,$10,
            $11,
            $12,
            $13,$14,$15,$16,
            $17
        )
        RETURNING *
        `,
        [
            tmdbData.title,
            tmdbData.originalTitle,
            parsed.year,
            tmdbData.tmdbId,
            tmdbData.imdbId,
            tmdbData.overview,
            tmdbData.poster,
            tmdbData.backdrop,
            tmdbData.voteAverage,
            tmdbData.voteCount,
            tmdbData.runtime,
            tmdbData.genres,
            parsed.quality,
            parsed.source,
            parsed.codec,
            parsed.audio,
            stagingMessageId
        ]
    );

    return result.rows[0];
}

module.exports = {
    findOrCreateMovie,
};