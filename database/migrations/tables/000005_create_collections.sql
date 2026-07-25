/*
================================================================
Library Of Legends 2.0
Migration: 000005_create_collections.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Collection-Tabelle.

Collections dienen zur Gruppierung zusammengehöriger
Medien, beispielsweise Filmreihen, Universen oder
Sondereditionen.

Beispiele:
- Marvel Cinematic Universe
- Star Wars
- Harry Potter
- Fast & Furious
- Jurassic Park
- Disney Meisterwerke
- James Bond

Erstellt:
- collections

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS collections
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL UNIQUE,

    original_name TEXT,

    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    tmdb_collection_id INTEGER,

    poster_path TEXT,

    backdrop_path TEXT,

    logo_path TEXT,

    sort_title TEXT,

    release_year INTEGER,

    end_year INTEGER,

    media_count INTEGER NOT NULL DEFAULT 0,

    is_completed INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collections_name
ON collections(name);

CREATE INDEX IF NOT EXISTS idx_collections_slug
ON collections(slug);

CREATE INDEX IF NOT EXISTS idx_collections_tmdb
ON collections(tmdb_collection_id);

CREATE INDEX IF NOT EXISTS idx_collections_active
ON collections(is_active);

CREATE INDEX IF NOT EXISTS idx_collections_sort_title
ON collections(sort_title);

COMMIT;