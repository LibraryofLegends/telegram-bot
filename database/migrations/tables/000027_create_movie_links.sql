/*
================================================================
Library Of Legends 2.0
Migration: 000027_create_movie_links.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Link- und Referenztabelle für Filme.

Diese Tabelle speichert sämtliche externen IDs und URLs,
die einem Film zugeordnet werden können.

Unterstützte Quellen:
- TMDb
- IMDb
- TVDb
- Wikidata
- Wikipedia
- Letterboxd
- Trakt
- JustWatch
- YouTube
- Offizielle Webseiten
- Weitere externe Dienste

Ein Film kann beliebig viele Links besitzen.
Pro Quelle darf jedoch nur ein Eintrag existieren.

Erstellt:
- movie_links

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_links
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    source TEXT NOT NULL,

    external_id TEXT,

    url TEXT,

    title TEXT,

    link_type TEXT,

    language TEXT,

    country_code TEXT,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_official INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    last_checked_at DATETIME,

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

CREATE INDEX IF NOT EXISTS idx_movie_links_movie
ON movie_links(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_links_source
ON movie_links(source);

CREATE INDEX IF NOT EXISTS idx_movie_links_external_id
ON movie_links(external_id);

CREATE INDEX IF NOT EXISTS idx_movie_links_type
ON movie_links(link_type);

CREATE INDEX IF NOT EXISTS idx_movie_links_language
ON movie_links(language);

CREATE INDEX IF NOT EXISTS idx_movie_links_country
ON movie_links(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_links_primary
ON movie_links(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_links_official
ON movie_links(is_official);

CREATE INDEX IF NOT EXISTS idx_movie_links_active
ON movie_links(is_active);

COMMIT;