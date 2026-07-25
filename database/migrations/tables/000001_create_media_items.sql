/*
================================================================
Library Of Legends 2.0
Migration: 000001_create_media_items.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Basistabelle für sämtliche Medienobjekte.

Alle Medientypen besitzen genau einen Datensatz in dieser
Tabelle. Spezifische Informationen befinden sich in den
jeweiligen Untertabellen (movies, series, books usw.).

Erstellt:
- media_items

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS media_items
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    media_type TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'active',

    visibility TEXT NOT NULL DEFAULT 'public',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at DATETIME,

    version INTEGER NOT NULL DEFAULT 1
);

COMMIT;