/*
================================================================
Library Of Legends 2.0
Migration: 000037_create_movie_editions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für verschiedene
Filmfassungen und Editionen.

Diese Tabelle ermöglicht die Verwaltung mehrerer
Versionen desselben Films.

Unterstützte Editionen:
- Kinofassung
- Director's Cut
- Extended Cut
- Ultimate Edition
- Unrated
- Remastered
- Anniversary Edition
- Collector's Edition
- IMAX Version
- Open Matte
- 3D Version
- 4DX Version
- TV Version
- International Cut
- Weitere Editionen

Erstellt:
- movie_editions

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_editions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    edition_name TEXT NOT NULL,

    edition_type TEXT NOT NULL,

    version TEXT,

    runtime_minutes INTEGER,

    additional_runtime_minutes INTEGER,

    release_date DATE,

    country_code TEXT,

    language TEXT,

    description TEXT,

    source TEXT,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_theatrical INTEGER NOT NULL DEFAULT 0,

    is_directors_cut INTEGER NOT NULL DEFAULT 0,

    is_extended INTEGER NOT NULL DEFAULT 0,

    is_remastered INTEGER NOT NULL DEFAULT 0,

    is_restored INTEGER NOT NULL DEFAULT 0,

    is_uncut INTEGER NOT NULL DEFAULT 0,

    is_unrated INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_editions_movie
ON movie_editions(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_editions_name
ON movie_editions(edition_name);

CREATE INDEX IF NOT EXISTS idx_movie_editions_type
ON movie_editions(edition_type);

CREATE INDEX IF NOT EXISTS idx_movie_editions_release_date
ON movie_editions(release_date);

CREATE INDEX IF NOT EXISTS idx_movie_editions_country
ON movie_editions(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_editions_default
ON movie_editions(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_editions_theatrical
ON movie_editions(is_theatrical);

CREATE INDEX IF NOT EXISTS idx_movie_editions_directors_cut
ON movie_editions(is_directors_cut);

CREATE INDEX IF NOT EXISTS idx_movie_editions_extended
ON movie_editions(is_extended);

CREATE INDEX IF NOT EXISTS idx_movie_editions_remastered
ON movie_editions(is_remastered);

CREATE INDEX IF NOT EXISTS idx_movie_editions_restored
ON movie_editions(is_restored);

CREATE INDEX IF NOT EXISTS idx_movie_editions_uncut
ON movie_editions(is_uncut);

CREATE INDEX IF NOT EXISTS idx_movie_editions_unrated
ON movie_editions(is_unrated);

CREATE INDEX IF NOT EXISTS idx_movie_editions_active
ON movie_editions(is_active);

COMMIT;