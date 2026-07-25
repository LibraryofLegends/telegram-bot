/*
================================================================
Library Of Legends 2.0
Migration: 000020_create_tags.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tag-Tabelle.

Tags dienen zur detaillierten Kategorisierung von Medien.
Im Gegensatz zu Genres können beliebig viele Tags vergeben
werden und bilden Eigenschaften, Themen oder Merkmale ab.

Beispiele:
- Oscar-Gewinner
- Alien
- Dinosaurier
- Zombie
- Weihnachten
- Weltraum
- Zeitreise
- Künstliche Intelligenz
- Superheld
- Vampir

Erstellt:
- tags

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS tags
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL UNIQUE,

    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    category TEXT,

    color TEXT,

    icon TEXT,

    usage_count INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_featured INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name
ON tags(name);

CREATE INDEX IF NOT EXISTS idx_tags_slug
ON tags(slug);

CREATE INDEX IF NOT EXISTS idx_tags_category
ON tags(category);

CREATE INDEX IF NOT EXISTS idx_tags_usage_count
ON tags(usage_count);

CREATE INDEX IF NOT EXISTS idx_tags_sort_order
ON tags(sort_order);

CREATE INDEX IF NOT EXISTS idx_tags_featured
ON tags(is_featured);

CREATE INDEX IF NOT EXISTS idx_tags_active
ON tags(is_active);

COMMIT;