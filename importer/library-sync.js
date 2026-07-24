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

    // Logik wird im nächsten Schritt übernommen

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