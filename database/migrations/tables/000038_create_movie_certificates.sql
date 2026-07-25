/*
================================================================
Library Of Legends 2.0
Migration: 000038_create_movie_certificates.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für physische
Filmveröffentlichungen.

Diese Tabelle verwaltet sämtliche Editionen auf
physischen Datenträgern inklusive technischer,
kommerzieller und sammlerrelevanter Informationen.

Unterstützte Medien:
- VHS
- DVD
- HD DVD
- Blu-ray
- Blu-ray 3D
- UHD Blu-ray
- LaserDisc
- Steelbook
- Mediabook
- Digibook
- Collector's Edition
- Limited Edition
- Box Set
- Weitere Veröffentlichungen

Erstellt:
- movie_certificates

Abhängigkeiten:
- 000002_create_movies.sql
- 000037_create_movie_editions.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_certificates
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    edition_id INTEGER,

    media_type TEXT NOT NULL,

    edition_name TEXT,

    publisher TEXT,

    distributor TEXT,

    label TEXT,

    catalog_number TEXT,

    ean TEXT,

    upc TEXT,

    asin TEXT,

    release_date DATE,

    country_code TEXT,

    region_code TEXT,

    language TEXT,

    packaging_type TEXT,

    disc_count INTEGER DEFAULT 1,

    runtime_minutes INTEGER,

    video_format TEXT,

    aspect_ratio TEXT,

    resolution TEXT,

    hdr_format TEXT,

    audio_format TEXT,

    subtitle_languages TEXT,

    special_features TEXT,

    limited_edition INTEGER NOT NULL DEFAULT 0,

    numbered_edition INTEGER NOT NULL DEFAULT 0,

    oop INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (edition_id)
        REFERENCES movie_editions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_movie
ON movie_certificates(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_edition
ON movie_certificates(edition_id);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_media_type
ON movie_certificates(media_type);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_release_date
ON movie_certificates(release_date);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_country
ON movie_certificates(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_region
ON movie_certificates(region_code);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_publisher
ON movie_certificates(publisher);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_label
ON movie_certificates(label);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_ean
ON movie_certificates(ean);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_upc
ON movie_certificates(upc);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_asin
ON movie_certificates(asin);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_limited
ON movie_certificates(limited_edition);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_numbered
ON movie_certificates(numbered_edition);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_oop
ON movie_certificates(oop);

CREATE INDEX IF NOT EXISTS idx_movie_certificates_active
ON movie_certificates(is_active);

COMMIT;