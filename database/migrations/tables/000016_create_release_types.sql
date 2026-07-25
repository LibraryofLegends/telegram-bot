/*
================================================================
Library Of Legends 2.0
Migration: 000016_create_release_types.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Veröffentlichungsarten.

Diese Tabelle dient als Referenz für sämtliche
Veröffentlichungsformen eines Mediums.

Beispiele:
- Kino
- DVD
- Blu-ray
- 4K UHD Blu-ray
- HD DVD
- VHS
- LaserDisc
- WEB-DL
- WEBRip
- HDTV
- TV
- Streaming
- Digital Download

Erstellt:
- release_types

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS release_types
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL UNIQUE,

    short_name TEXT,

    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    media_type TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_physical INTEGER NOT NULL DEFAULT 0,

    is_digital INTEGER NOT NULL DEFAULT 0,

    is_streaming INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_release_types_name
ON release_types(name);

CREATE INDEX IF NOT EXISTS idx_release_types_slug
ON release_types(slug);

CREATE INDEX IF NOT EXISTS idx_release_types_media_type
ON release_types(media_type);

CREATE INDEX IF NOT EXISTS idx_release_types_sort_order
ON release_types(sort_order);

CREATE INDEX IF NOT EXISTS idx_release_types_physical
ON release_types(is_physical);

CREATE INDEX IF NOT EXISTS idx_release_types_digital
ON release_types(is_digital);

CREATE INDEX IF NOT EXISTS idx_release_types_streaming
ON release_types(is_streaming);

CREATE INDEX IF NOT EXISTS idx_release_types_active
ON release_types(is_active);

COMMIT;