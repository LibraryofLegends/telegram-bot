/*
================================================================
Library Of Legends 2.0
Migration: 000003_create_genres.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Genre-Tabelle.

Diese Tabelle dient als gemeinsame Referenz für alle
Medientypen (Filme, Serien, Bücher, Comics, Hörspiele,
Hörbücher usw.).

Erstellt:
- genres

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS genres
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL UNIQUE,

    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    color TEXT,

    icon TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_genres_name
ON genres(name);

CREATE INDEX IF NOT EXISTS idx_genres_slug
ON genres(slug);

CREATE INDEX IF NOT EXISTS idx_genres_sort_order
ON genres(sort_order);

CREATE INDEX IF NOT EXISTS idx_genres_active
ON genres(is_active);

COMMIT;