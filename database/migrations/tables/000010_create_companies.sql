/*
================================================================
Library Of Legends 2.0
Migration: 000010_create_companies.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Unternehmen-Tabelle.

Diese Tabelle speichert sämtliche Unternehmen, die an
einem Medium beteiligt sind.

Beispiele:
- Produktionsfirmen
- Filmstudios
- Verleiher
- Streaming-Anbieter
- Fernsehsender
- Animation Studios
- Visual Effects Studios

Erstellt:
- companies

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS companies
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    tmdb_company_id INTEGER,

    imdb_company_id TEXT,

    name TEXT NOT NULL,

    original_name TEXT,

    slug TEXT NOT NULL UNIQUE,

    description TEXT,

    headquarters TEXT,

    country TEXT,

    founded_year INTEGER,

    homepage TEXT,

    logo_path TEXT,

    poster_path TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_tmdb
ON companies(tmdb_company_id);

CREATE INDEX IF NOT EXISTS idx_companies_imdb
ON companies(imdb_company_id);

CREATE INDEX IF NOT EXISTS idx_companies_name
ON companies(name);

CREATE INDEX IF NOT EXISTS idx_companies_slug
ON companies(slug);

CREATE INDEX IF NOT EXISTS idx_companies_country
ON companies(country);

CREATE INDEX IF NOT EXISTS idx_companies_active
ON companies(is_active);

COMMIT;