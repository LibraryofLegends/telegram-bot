/*
================================================================
Library Of Legends 2.0
Migration: 000049_create_movie_duplicates.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle zur Erkennung und
Verwaltung von Dubletten innerhalb der Bibliothek.

Diese Tabelle speichert automatisch erkannte sowie
manuell bestätigte Dubletten und dient der
Qualitätssicherung der gesamten Mediensammlung.

Unterstützte Vergleichsmerkmale:
- TMDb-ID
- IMDb-ID
- Dateiname
- Dateigröße
- Dateihash
- Laufzeit
- Auflösung
- Videocodec
- Audiocodec
- Audiospuren
- Untertitel
- Fingerprints
- KI-Ähnlichkeit
- Manuelle Prüfung

Erstellt:
- movie_duplicates

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_duplicates
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    primary_movie_id INTEGER NOT NULL,

    duplicate_movie_id INTEGER NOT NULL,

    duplicate_type TEXT NOT NULL,

    confidence_score REAL NOT NULL DEFAULT 0,

    ai_similarity_score REAL,

    title_similarity REAL,

    metadata_similarity REAL,

    file_similarity REAL,

    fingerprint_similarity REAL,

    hash_match INTEGER NOT NULL DEFAULT 0,

    runtime_match INTEGER NOT NULL DEFAULT 0,

    resolution_match INTEGER NOT NULL DEFAULT 0,

    codec_match INTEGER NOT NULL DEFAULT 0,

    audio_match INTEGER NOT NULL DEFAULT 0,

    subtitle_match INTEGER NOT NULL DEFAULT 0,

    tmdb_match INTEGER NOT NULL DEFAULT 0,

    imdb_match INTEGER NOT NULL DEFAULT 0,

    manually_verified INTEGER NOT NULL DEFAULT 0,

    merged INTEGER NOT NULL DEFAULT 0,

    ignored INTEGER NOT NULL DEFAULT 0,

    reviewed_by TEXT,

    reviewed_at DATETIME,

    notes TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        primary_movie_id,
        duplicate_movie_id
    ),

    FOREIGN KEY (primary_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (duplicate_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_primary
ON movie_duplicates(primary_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_duplicate
ON movie_duplicates(duplicate_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_type
ON movie_duplicates(duplicate_type);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_confidence
ON movie_duplicates(confidence_score);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_ai
ON movie_duplicates(ai_similarity_score);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_verified
ON movie_duplicates(manually_verified);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_merged
ON movie_duplicates(merged);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_ignored
ON movie_duplicates(ignored);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_reviewed_at
ON movie_duplicates(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_movie_duplicates_created_at
ON movie_duplicates(created_at);

COMMIT;