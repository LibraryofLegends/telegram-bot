const fetch = global.fetch;

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";

function hasTMDB() {
    return Boolean(TMDB_API_KEY);
}

async function searchTMDB(type, title, year = null) {
    if (!hasTMDB()) return null;

    try {
        const endpoint = type === "movie" ? "movie" : "tv";

        let url =
            `${TMDB_BASE_URL}/search/${endpoint}` +
            `?api_key=${TMDB_API_KEY}` +
            `&language=de-DE` +
            `&query=${encodeURIComponent(title)}`;

        if (year) {
            if (type === "movie") {
                url += `&year=${year}`;
            } else {
                url += `&first_air_date_year=${year}`;
            }
        }

        const response = await fetch(url);

        if (!response.ok) return null;

        const json = await response.json();

        if (!json.results?.length) return null;

        return json.results[0];
    } catch (err) {
        console.error("❌ TMDB Suche:", err.message);
        return null;
    }
}

async function getTMDBDetails(type, tmdbId) {
    if (!hasTMDB()) return null;

    try {
        const endpoint = type === "movie" ? "movie" : "tv";

        const url =
            `${TMDB_BASE_URL}/${endpoint}/${tmdbId}` +
            `?api_key=${TMDB_API_KEY}` +
            `&language=de-DE` +
            `&append_to_response=credits,images`;

        const response = await fetch(url);

        if (!response.ok) return null;

        const json = await response.json();

        return {
            tmdbId: json.id,
            imdbId: json.imdb_id || null,
            title: json.title || json.name || null,
            originalTitle: json.original_title || json.original_name || null,
            overview: json.overview || null,
            releaseDate: json.release_date || json.first_air_date || null,
            voteAverage: json.vote_average || null,
            voteCount: json.vote_count || null,
            runtime: json.runtime || null,
            seasons: json.number_of_seasons || null,
            episodes: json.number_of_episodes || null,
            genres: (json.genres || []).map(g => g.name),

            poster: json.poster_path
                ? TMDB_IMAGE_URL + json.poster_path
                : null,

            backdrop: json.backdrop_path
                ? TMDB_IMAGE_URL + json.backdrop_path
                : null,

            cast: (json.credits?.cast || [])
                .slice(0, 10)
                .map(actor => actor.name),

            directors: (json.credits?.crew || [])
                .filter(c => c.job === "Director")
                .map(c => c.name),
        };
    } catch (err) {
        console.error("❌ TMDB Details:", err.message);
        return null;
    }
}

module.exports = {
    hasTMDB,
    searchTMDB,
    getTMDBDetails,
};