const fetch = global.fetch;

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";

function hasTMDB() {
    return Boolean(TMDB_API_KEY);
}

module.exports = {
    hasTMDB,
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMAGE_URL,
};