async function findOrCreateSeries(
    pgPool,
    parsed,
    tmdbData = null
) {
    if (!pgPool)
        return null;

    let result = await pgPool.query(
        `
        SELECT *
        FROM series
        WHERE LOWER(title)=LOWER($1)
        LIMIT 1
        `,
        [
            parsed.title
        ]
    );

    if (result.rows.length) {
        return result.rows[0];
    }

    result = await pgPool.query(
        `
        INSERT INTO series(
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
            genres,
            number_of_seasons,
            number_of_episodes
        )
        VALUES(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13
        )
        RETURNING *
        `,
        [
            tmdbData?.title || parsed.title,
            tmdbData?.originalTitle || null,
            parsed.year || null,
            tmdbData?.tmdbId || null,
            tmdbData?.imdbId || null,
            tmdbData?.overview || null,
            tmdbData?.poster || null,
            tmdbData?.backdrop || null,
            tmdbData?.voteAverage || null,
            tmdbData?.voteCount || null,
            tmdbData?.genres || [],
            tmdbData?.seasons || null,
            tmdbData?.episodes || null
        ]
    );

    console.log("✅ Neue Serie angelegt:", parsed.title);

    return result.rows[0];
}

module.exports = {
    findOrCreateSeries,
};