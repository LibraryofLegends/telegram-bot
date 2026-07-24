async function syncLibrary(
    pgPool,
    parsed,
    tmdbData,
    findOrCreateMovie,
    findOrCreateSeries,
    findOrCreateSeason
) {
    let librarySeries = null;
    let librarySeason = null;
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

    return {
        librarySeries,
        librarySeason,
        libraryMovie,
    };
}