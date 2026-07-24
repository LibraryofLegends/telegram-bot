async function syncLibrary(
    pgPool,
    parsed,
    tmdbData,
    stagingMessageId,
    findOrCreateMovie,
    findOrCreateSeries,
    findOrCreateSeason,
    findOrCreateEpisode
) {
    let librarySeries = null;
    let librarySeason = null;
    let libraryEpisode = null;
    let libraryMovie = null;

    if (parsed.type === "movie") {
    libraryMovie = await findOrCreateMovie(
        pgPool,
        parsed,
        tmdbData
    );
} else if (parsed.type === "series") {
    librarySeries = await findOrCreateSeries(
        pgPool,
        parsed,
        tmdbData
    );

    librarySeason = await findOrCreateSeason(
        pgPool,
        librarySeries.id,
        parsed.season
    );
}

if (parsed.type === "series" && librarySeason) {
    libraryEpisode = await findOrCreateEpisode(
        pgPool,
        librarySeason.id,
        parsed,
        stagingMessageId
    );
}

if (
    parsed.type === "movie" &&
    libraryMovie
) {
    await pgPool.query(
        `
        UPDATE movies
        SET
            staging_message_id=$1,
            updated_at=NOW()
        WHERE id=$2
        `,
        [
            stagingMessageId,
            libraryMovie.id
        ]
    );
}

    return {
        librarySeries,
        librarySeason,
        libraryEpisode,
        libraryMovie,
    };
}

module.exports = {
    syncLibrary,
};