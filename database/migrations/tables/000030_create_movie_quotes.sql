/*
================================================================
Library Of Legends 2.0
Migration: 000030_create_movie_quotes.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Filmzitate,
Dialoge und Monologe.

Diese Tabelle speichert bekannte Zitate,
ikonische Dialoge sowie zusätzliche Informationen
über Sprecher, Sprache und Position innerhalb
des Films.

Verwendungszwecke:
- Zitat-Sammlung
- Filmsuche
- Detailseiten
- Trivia
- Easter Eggs
- Sprachvergleich
- Statistiken

Erstellt:
- movie_quotes

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_quotes
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    quote TEXT NOT NULL,

    speaker TEXT,

    character_name TEXT,

    language TEXT,

    quote_type TEXT,

    start_time_seconds INTEGER,

    end_time_seconds INTEGER,

    scene_description TEXT,

    source TEXT,

    is_spoiler INTEGER NOT NULL DEFAULT 0,

    is_featured INTEGER NOT NULL DEFAULT 0,

    is_verified INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_movie
ON movie_quotes(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_language
ON movie_quotes(language);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_speaker
ON movie_quotes(speaker);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_character
ON movie_quotes(character_name);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_type
ON movie_quotes(quote_type);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_spoiler
ON movie_quotes(is_spoiler);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_featured
ON movie_quotes(is_featured);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_verified
ON movie_quotes(is_verified);

CREATE INDEX IF NOT EXISTS idx_movie_quotes_sort
ON movie_quotes(sort_order);

COMMIT;