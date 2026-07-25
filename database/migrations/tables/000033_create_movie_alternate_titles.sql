/*
================================================================
Library Of Legends 2.0
Migration: 000033_create_movie_alternate_titles.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für alternative Filmtitel.

Diese Tabelle speichert sämtliche bekannten Titelvarianten
eines Films.

Unterstützte Titeltypen:
- Originaltitel
- Deutscher Titel
- Internationaler Titel
- Englischer Titel
- Festivaltitel
- Arbeitstitel
- TV-Titel
- DVD-/Blu-ray-Titel
- Streaming-Titel
- Alternativer Titel
- Sonstige Varianten

Ein Film kann beliebig viele Titel besitzen.

Erstellt:
- movie_alternate_titles

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_alternate_titles
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    title_type TEXT NOT NULL,

    language TEXT,

    country_code TEXT,

    is_original_title INTEGER NOT NULL DEFAULT 0,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_official INTEGER NOT NULL DEFAULT 1,

    source TEXT,

    source_url TEXT,

    release_year INTEGER,

    notes TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_movie
ON movie_alternate_titles(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_title
ON movie_alternate_titles(title);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_type
ON movie_alternate_titles(title_type);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_language
ON movie_alternate_titles(language);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_country
ON movie_alternate_titles(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_original
ON movie_alternate_titles(is_original_title);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_primary
ON movie_alternate_titles(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_official
ON movie_alternate_titles(is_official);

CREATE INDEX IF NOT EXISTS idx_movie_alternate_titles_sort
ON movie_alternate_titles(sort_order);

COMMIT;