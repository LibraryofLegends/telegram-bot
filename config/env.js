const TOKEN = process.env.TOKEN;

module.exports = {
    TOKEN,

    TMDB_KEY: process.env.TMDB_KEY,
    OMDB_KEY: process.env.OMDB_KEY || "",

    MOVIE_GROUP_ID: process.env.MOVIE_GROUP_ID,
    SERIES_GROUP_ID: process.env.SERIES_GROUP_ID,

    ADMIN_ID: String(process.env.ADMIN_ID || ""),
    BOT_USERNAME: process.env.BOT_USERNAME || "",

    BASE_URL: TOKEN
        ? `https://api.telegram.org/bot${TOKEN}`
        : ""
};