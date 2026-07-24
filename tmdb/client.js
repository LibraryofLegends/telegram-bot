const fetch = global.fetch;

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";

function hasTMDB() {
    return Boolean(TMDB_API_KEY);
}

async function searchTMDB(type, title, year = null) {
    if (!hasTMDB()) {
        return null;
    }

    try {
        const endpoint =
            type === "movie"
                ? "movie"
                : "tv";

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

        if (!response.ok) {
            return null;
        }

        const json = await response.json();

        if (!json.results?.length) {
            return null;
        }

        return json.results[0];

    } catch (err) {
        console.error("❌ TMDB Suche:", err.message);
        return null;
    }
}

module.exports = {
    hasTMDB,
    searchTMDB,
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMAGE_URL,
};