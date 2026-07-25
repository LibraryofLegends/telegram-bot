/*
================================================================
Library Of Legends 2.0
Migration: 000002_create_movies.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Filmtabelle.

Diese Tabelle enthält alle filmspezifischen Informationen.
Jeder Film besitzt genau einen Eintrag in media_items und
genau einen Eintrag in movies.

Erstellt:
- movies

Abhängigkeiten:
- 000001_create_media_items.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movies
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    media_item_id INTEGER NOT NULL UNIQUE,

    tmdb_id INTEGER,

    imdb_id TEXT,

    original_title TEXT NOT NULL,

    german_title TEXT,

    sort_title TEXT,

    original_language TEXT,

    release_date DATE,

    runtime_minutes INTEGER,

    production_year INTEGER,

    tagline TEXT,

    overview TEXT,

    budget INTEGER,

    revenue INTEGER,

    popularity REAL,

    vote_average REAL,

    vote_count INTEGER,

    adult INTEGER NOT NULL DEFAULT 0,

    homepage TEXT,

    poster_path TEXT,

    backdrop_path TEXT,

    trailer_url TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (media_item_id)
        REFERENCES media_items(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb
ON movies (tmdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_imdb
ON movies (imdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_original_title
ON movies (original_title);

CREATE INDEX IF NOT EXISTS idx_movies_german_title
ON movies (german_title);

CREATE INDEX IF NOT EXISTS idx_movies_release_date
ON movies (release_date);

CREATE INDEX IF NOT EXISTS idx_movies_year
ON movies (production_year);

COMMIT;