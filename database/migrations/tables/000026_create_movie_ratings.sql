/*
================================================================
Library Of Legends 2.0
Migration: 000026_create_movie_ratings.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Bewertungstabelle für Filme.

Diese Tabelle speichert sämtliche Bewertungen eines Films
aus unterschiedlichen Quellen.

Unterstützte Quellen:
- TMDb
- IMDb
- Rotten Tomatoes
- Metacritic
- Letterboxd
- Trakt
- Library Of Legends
- Benutzerbewertungen
- Weitere externe Anbieter

Ein Film kann mehrere Bewertungen besitzen.
Jede Quelle besitzt genau einen Datensatz pro Film.

Erstellt:
- movie_ratings

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ratings
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    source TEXT NOT NULL,

    rating_value REAL,

    rating_max REAL NOT NULL DEFAULT 10,

    vote_count INTEGER NOT NULL DEFAULT 0,

    popularity REAL,

    ranking INTEGER,

    url TEXT,

    last_synced_at DATETIME,

    is_verified INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        source
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie
ON movie_ratings(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_source
ON movie_ratings(source);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_value
ON movie_ratings(rating_value);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_votes
ON movie_ratings(vote_count);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_popularity
ON movie_ratings(popularity);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_ranking
ON movie_ratings(ranking);

CREATE INDEX IF NOT EXISTS idx_movie_ratings_verified
ON movie_ratings(is_verified);

COMMIT;