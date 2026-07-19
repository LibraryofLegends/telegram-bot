const { db, addColumnIfMissing } = require("./sqlite");

function runMigrations() {

  // Movies
  addColumnIfMissing("movies", "collection", "TEXT");
  addColumnIfMissing("movies", "quality", "TEXT");
  addColumnIfMissing("movies", "audio", "TEXT");
  addColumnIfMissing("movies", "source", "TEXT");
  addColumnIfMissing("movies", "fsk", "TEXT");
  addColumnIfMissing("movies", "director", "TEXT");
  addColumnIfMissing("movies", "cast", "TEXT");
  addColumnIfMissing("movies", "library_id", "TEXT");
  addColumnIfMissing("movies", "resolution", "TEXT");
  addColumnIfMissing("movies", "file_size", "TEXT");
  addColumnIfMissing("movies", "file_size_bytes", "INTEGER");
  addColumnIfMissing("movies", "video_codec", "TEXT");
  addColumnIfMissing("movies", "audio_codec", "TEXT");
  addColumnIfMissing("movies", "audio_channels", "TEXT");
  addColumnIfMissing("movies", "hdr", "TEXT");
  addColumnIfMissing("movies", "universe", "TEXT");
  addColumnIfMissing("movies", "universe_phase", "TEXT");
  addColumnIfMissing("movies", "universe_order", "INTEGER");
  addColumnIfMissing("movies", "starwars_era", "TEXT");

  // Series
  addColumnIfMissing("series", "series_library_id", "INTEGER");
  addColumnIfMissing("series", "universe", "TEXT");
  addColumnIfMissing("series", "universe_phase", "TEXT");
  addColumnIfMissing("series", "universe_order", "INTEGER");
  addColumnIfMissing("series", "starwars_era", "TEXT");
  addColumnIfMissing("series_news", "category", "TEXT");

  // Series Library
  addColumnIfMissing("series_library", "tmdb_id", "INTEGER");
  addColumnIfMissing("series_library", "first_air_date", "TEXT");
  addColumnIfMissing("series_library", "last_air_date", "TEXT");
  addColumnIfMissing("series_library", "genres", "TEXT");
  addColumnIfMissing("series_library", "rating", "TEXT");
  addColumnIfMissing("series_library", "overview", "TEXT");
  addColumnIfMissing("series_library", "poster_url", "TEXT");
  addColumnIfMissing("series_library", "total_seasons", "INTEGER");
  addColumnIfMissing("series_library", "total_episodes", "INTEGER");
  addColumnIfMissing("series_library", "status", "TEXT");

  // Series Topics
  addColumnIfMissing("series_topics", "hub_message_id", "INTEGER");
  addColumnIfMissing("series_topics", "banner_message_id", "INTEGER");

  // Topics
  addColumnIfMissing("topics", "hub_message_id", "INTEGER");
  addColumnIfMissing("topics", "season_separators", "TEXT DEFAULT '{}'");
  addColumnIfMissing("topics", "series_banner_message_id", "INTEGER");
  addColumnIfMissing("topics", "episode_list_message_id", "INTEGER");
  addColumnIfMissing("topics", "movie_hub_message_id", "INTEGER");
  addColumnIfMissing("topics", "movie_banner_message_id", "INTEGER");
  addColumnIfMissing("topics", "universe_hub_message_id", "INTEGER");
  addColumnIfMissing("topics", "universe_banner_message_id", "INTEGER");

  // Collections
  addColumnIfMissing("collections", "hub_message_id", "INTEGER");
  addColumnIfMissing("collections", "banner_message_id", "INTEGER");


  console.log("â Datenbank bereit");
}

module.exports = {
  runMigrations
};