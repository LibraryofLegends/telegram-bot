async function loadTMDBData(parsed, searchTMDB, getTMDBDetails) {
    let tmdbSearch = null;
    let tmdbData = null;

    if (parsed.type === "movie") {
        tmdbSearch = await searchTMDB(
            "movie",
            parsed.title,
            parsed.year
        );
    } else if (
        parsed.type === "series" ||
        parsed.type === "season"
    ) {
        tmdbSearch = await searchTMDB(
            "tv",
            parsed.title,
            parsed.year
        );
    }

    if (tmdbSearch) {
        tmdbData = await getTMDBDetails(
            parsed.type === "movie"
                ? "movie"
                : "tv",
            tmdbSearch.id
        );

        console.log(
            "🎬 TMDB:",
            tmdbData?.title
        );
    }

    return {
        tmdbSearch,
        tmdbData,
    };
}

module.exports = {
    loadTMDBData,
};