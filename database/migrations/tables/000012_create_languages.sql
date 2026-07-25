/*
================================================================
Library Of Legends 2.0
Migration: 000012_create_languages.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Sprach-Tabelle.

Diese Tabelle dient als Referenz für sämtliche Sprachen
innerhalb des Systems.

Beispiele:
- Originalsprache
- Audiospur
- Untertitel
- Benutzeroberfläche
- Metadaten

Erstellt:
- languages

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS languages
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    iso_639_1 TEXT NOT NULL UNIQUE,

    iso_639_2 TEXT,

    english_name TEXT NOT NULL,

    german_name TEXT NOT NULL,

    native_name TEXT,

    locale TEXT,

    text_direction TEXT NOT NULL DEFAULT 'ltr',

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_languages_iso6391
ON languages(iso_639_1);

CREATE INDEX IF NOT EXISTS idx_languages_iso6392
ON languages(iso_639_2);

CREATE INDEX IF NOT EXISTS idx_languages_english_name
ON languages(english_name);

CREATE INDEX IF NOT EXISTS idx_languages_german_name
ON languages(german_name);

CREATE INDEX IF NOT EXISTS idx_languages_native_name
ON languages(native_name);

CREATE INDEX IF NOT EXISTS idx_languages_locale
ON languages(locale);

CREATE INDEX IF NOT EXISTS idx_languages_active
ON languages(is_active);

COMMIT;