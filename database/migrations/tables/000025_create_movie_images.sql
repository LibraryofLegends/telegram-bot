/*
================================================================
Library Of Legends 2.0
Migration: 000025_create_movie_images.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Bildverwaltung für Filme.

Diese Tabelle speichert sämtliche Grafiken eines Films,
unabhängig von deren Herkunft.

Unterstützte Bildtypen:
- Poster
- Backdrop
- Logo
- Banner
- Cover
- Disc Art
- Screenshot
- Thumbnail
- Fanart
- Character Art

Die Tabelle unterstützt sowohl automatisch importierte
Bilder (z.B. TMDb) als auch manuell hinzugefügte Grafiken.

Erstellt:
- movie_images

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_images
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    image_type TEXT NOT NULL,

    language TEXT,

    title TEXT,

    source TEXT,

    original_url TEXT,

    local_path TEXT,

    storage_provider TEXT,

    storage_path TEXT,

    storage_url TEXT,

    width INTEGER,

    height INTEGER,

    file_size INTEGER,

    mime_type TEXT,

    checksum_md5 TEXT,

    checksum_sha256 TEXT,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    sort_order INTEGER NOT NULL DEFAULT 0,

    imported_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_images_movie
ON movie_images(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_images_uuid
ON movie_images(uuid);

CREATE INDEX IF NOT EXISTS idx_movie_images_type
ON movie_images(image_type);

CREATE INDEX IF NOT EXISTS idx_movie_images_language
ON movie_images(language);

CREATE INDEX IF NOT EXISTS idx_movie_images_source
ON movie_images(source);

CREATE INDEX IF NOT EXISTS idx_movie_images_primary
ON movie_images(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_images_active
ON movie_images(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_images_sort
ON movie_images(sort_order);

COMMIT;