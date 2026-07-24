function enhanceImportReport(
    report,
    {
    importDbId,
    librarySeries,
    librarySeason,
    libraryEpisode,
    libraryMovie,
    libraryCollection,
    tmdbData,
}
) {
    if (importDbId) {
        report += `\n🆔 Import-ID: ${importDbId}`;
    }

    if (librarySeries) {
        report += `\n📺 Serien-ID: ${librarySeries.id}`;
    }

    if (librarySeason) {
        report += `\n📀 Staffel-ID: ${librarySeason.id}`;
    }

    if (libraryEpisode) {
        if (libraryEpisode.alreadyExists) {
            report += `\n♻️ Episode bereits vorhanden`;
        } else {
            report += `\n✅ Neue Episode gespeichert`;
        }
    }

    if (libraryMovie) {
        report += `\n🎬 Film-ID: ${libraryMovie.id}`;
    }
    
    if (libraryCollection) {
    report += `\n📚 Collection: ${libraryCollection.name}`;
}

    if (tmdbData) {
        report += "\n";
        report += "\n━━━━━━━━━━━━━━━━━━━━";
        report += "\n🎬 TMDB";
        report += "\n━━━━━━━━━━━━━━━━━━━━";

        report += `\n🆔 TMDB-ID: ${tmdbData.tmdbId}`;

        if (tmdbData.imdbId)
            report += `\n🎟 IMDb: ${tmdbData.imdbId}`;

        if (tmdbData.voteAverage)
            report += `\n⭐ Bewertung: ${tmdbData.voteAverage}/10`;

        if (tmdbData.genres?.length)
            report += `\n🎭 Genres: ${tmdbData.genres.join(", ")}`;

        if (tmdbData.runtime)
            report += `\n⏱ Laufzeit: ${tmdbData.runtime} Min.`;

        if (tmdbData.seasons)
            report += `\n📀 Staffeln: ${tmdbData.seasons}`;

        if (tmdbData.episodes)
            report += `\n🎞 Episoden: ${tmdbData.episodes}`;
    }

    return report;
}

module.exports = {
    enhanceImportReport,
};