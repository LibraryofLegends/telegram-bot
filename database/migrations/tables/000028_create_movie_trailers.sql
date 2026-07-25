/*
================================================================
Library Of Legends 2.0
Migration: 000028_create_movie_trailers.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung für Trailer und
zusätzliche Videoinhalte zu Filmen.

Unterstützte Videotypen:
- Trailer
- Teaser
- Clip
- Featurette
- Behind The Scenes
- Interview
- TV Spot
- Making Of
- Deleted Scene
- Bloopers
- Sonstige Videos

Unterstützte Plattformen:
- YouTube
- Vimeo
- TMDb
- Apple TV
- Offizielle Webseiten
- Weitere Anbieter

Erstellt:
- movie_trailers

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_trailers
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    video_type TEXT NOT NULL,

    source TEXT NOT NULL,

    language TEXT,

    country_code TEXT,

    external_id TEXT,

    youtube_key TEXT,

    url TEXT,

    thumbnail_url TEXT,

    duration_seconds INTEGER,

    resolution TEXT,

    published_at DATETIME,

    official INTEGER NOT NULL DEFAULT 0,

    featured INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    imported_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_movie
ON movie_trailers(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_source
ON movie_trailers(source);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_type
ON movie_trailers(video_type);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_language
ON movie_trailers(language);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_country
ON movie_trailers(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_external
ON movie_trailers(external_id);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_youtube
ON movie_trailers(youtube_key);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_featured
ON movie_trailers(featured);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_official
ON movie_trailers(official);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_active
ON movie_trailers(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_trailers_published
ON movie_trailers(published_at);

COMMIT;