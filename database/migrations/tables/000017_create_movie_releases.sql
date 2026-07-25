/*
================================================================
Library Of Legends 2.0
Migration: 000017_create_movie_releases.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Tabelle für Filmveröffentlichungen.

Ein Film kann mehrere Veröffentlichungen besitzen.

Beispiele:
- Kinostart
- Director's Cut
- Extended Edition
- Blu-ray
- DVD
- 4K UHD
- Streaming
- WEB-DL

Erstellt:
- movie_releases

Abhängigkeiten:
- 000002_create_movies.sql
- 000016_create_release_types.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_releases
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    release_type_id INTEGER NOT NULL,

    title TEXT,

    edition TEXT,

    country_code TEXT,

    release_date DATE,

    catalog_number TEXT,

    barcode TEXT,

    distributor TEXT,

    publisher TEXT,

    region_code TEXT,

    runtime_minutes INTEGER,

    is_uncut INTEGER NOT NULL DEFAULT 0,

    is_remastered INTEGER NOT NULL DEFAULT 0,

    is_limited INTEGER NOT NULL DEFAULT 0,

    is_collectors_edition INTEGER NOT NULL DEFAULT 0,

    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        release_type_id,
        edition,
        country_code
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (release_type_id)
        REFERENCES release_types(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_releases_movie
ON movie_releases(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_releases_release_type
ON movie_releases(release_type_id);

CREATE INDEX IF NOT EXISTS idx_movie_releases_release_date
ON movie_releases(release_date);

CREATE INDEX IF NOT EXISTS idx_movie_releases_country
ON movie_releases(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_releases_catalog
ON movie_releases(catalog_number);

CREATE INDEX IF NOT EXISTS idx_movie_releases_barcode
ON movie_releases(barcode);

CREATE INDEX IF NOT EXISTS idx_movie_releases_uncut
ON movie_releases(is_uncut);

CREATE INDEX IF NOT EXISTS idx_movie_releases_remastered
ON movie_releases(is_remastered);

CREATE INDEX IF NOT EXISTS idx_movie_releases_limited
ON movie_releases(is_limited);

CREATE INDEX IF NOT EXISTS idx_movie_releases_collectors
ON movie_releases(is_collectors_edition);

COMMIT;