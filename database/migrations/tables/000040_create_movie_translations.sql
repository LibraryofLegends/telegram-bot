/*
================================================================
Library Of Legends 2.0
Migration: 000040_create_movie_translations.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Übersetzungen
und lokalisierte Inhalte von Filmen.

Diese Tabelle speichert sämtliche sprachabhängigen
Texte eines Films.

Unterstützte Inhalte:
- Titel
- Originaltitel
- Alternativer Titel
- Kurzbeschreibung
- Inhaltsangabe
- Tagline
- Slogan
- Marketingtext
- Suchbegriffe
- SEO-Titel
- SEO-Beschreibung

Ein Film kann beliebig viele Übersetzungen besitzen.

Erstellt:
- movie_translations

Abhängigkeiten:
- 000002_create_movies.sql
- 000012_create_languages.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_translations
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    language_id INTEGER,

    language_code TEXT NOT NULL,

    country_code TEXT,

    localized_title TEXT NOT NULL,

    localized_original_title TEXT,

    localized_sort_title TEXT,

    tagline TEXT,

    short_description TEXT,

    overview TEXT,

    marketing_text TEXT,

    seo_title TEXT,

    seo_description TEXT,

    search_keywords TEXT,

    translator TEXT,

    source TEXT,

    is_official INTEGER NOT NULL DEFAULT 0,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_machine_translated INTEGER NOT NULL DEFAULT 0,

    is_verified INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        language_code,
        country_code
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (language_id)
        REFERENCES languages(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_translations_movie
ON movie_translations(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_translations_language
ON movie_translations(language_code);

CREATE INDEX IF NOT EXISTS idx_movie_translations_country
ON movie_translations(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_translations_title
ON movie_translations(localized_title);

CREATE INDEX IF NOT EXISTS idx_movie_translations_original_title
ON movie_translations(localized_original_title);

CREATE INDEX IF NOT EXISTS idx_movie_translations_official
ON movie_translations(is_official);

CREATE INDEX IF NOT EXISTS idx_movie_translations_default
ON movie_translations(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_translations_machine
ON movie_translations(is_machine_translated);

CREATE INDEX IF NOT EXISTS idx_movie_translations_verified
ON movie_translations(is_verified);

COMMIT;