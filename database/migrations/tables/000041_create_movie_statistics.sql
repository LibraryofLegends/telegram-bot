/*
================================================================
Library Of Legends 2.0
Migration: 000041_create_movie_statistics.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Statistik- und Analyse-Tabelle
für Filme.

Diese Tabelle speichert automatisch berechnete
Kennzahlen und dient als Grundlage für:

- Dashboards
- Ranglisten
- Bibliotheksstatistiken
- Qualitätsanalysen
- Performance-Auswertungen
- Sammlungsübersichten

Die Werte werden regelmäßig durch Importer,
Synchronisationen oder Hintergrundjobs aktualisiert.

Erstellt:
- movie_statistics

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_statistics
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL UNIQUE,

    file_count INTEGER NOT NULL DEFAULT 0,

    edition_count INTEGER NOT NULL DEFAULT 0,

    image_count INTEGER NOT NULL DEFAULT 0,

    trailer_count INTEGER NOT NULL DEFAULT 0,

    audio_track_count INTEGER NOT NULL DEFAULT 0,

    subtitle_count INTEGER NOT NULL DEFAULT 0,

    rating_count INTEGER NOT NULL DEFAULT 0,

    quote_count INTEGER NOT NULL DEFAULT 0,

    trivia_count INTEGER NOT NULL DEFAULT 0,

    soundtrack_count INTEGER NOT NULL DEFAULT 0,

    keyword_count INTEGER NOT NULL DEFAULT 0,

    tag_count INTEGER NOT NULL DEFAULT 0,

    country_count INTEGER NOT NULL DEFAULT 0,

    collection_count INTEGER NOT NULL DEFAULT 0,

    total_file_size BIGINT NOT NULL DEFAULT 0,

    total_runtime_seconds INTEGER NOT NULL DEFAULT 0,

    average_rating REAL NOT NULL DEFAULT 0,

    highest_rating REAL,

    lowest_rating REAL,

    popularity_score REAL NOT NULL DEFAULT 0,

    completeness_score REAL NOT NULL DEFAULT 0,

    metadata_score REAL NOT NULL DEFAULT 0,

    duplicate_count INTEGER NOT NULL DEFAULT 0,

    missing_assets_count INTEGER NOT NULL DEFAULT 0,

    last_import_at DATETIME,

    last_scan_at DATETIME,

    last_statistics_update DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_movie
ON movie_statistics(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_average_rating
ON movie_statistics(average_rating);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_popularity
ON movie_statistics(popularity_score);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_completeness
ON movie_statistics(completeness_score);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_metadata
ON movie_statistics(metadata_score);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_total_size
ON movie_statistics(total_file_size);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_runtime
ON movie_statistics(total_runtime_seconds);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_last_import
ON movie_statistics(last_import_at);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_last_scan
ON movie_statistics(last_scan_at);

CREATE INDEX IF NOT EXISTS idx_movie_statistics_last_update
ON movie_statistics(last_statistics_update);

COMMIT;