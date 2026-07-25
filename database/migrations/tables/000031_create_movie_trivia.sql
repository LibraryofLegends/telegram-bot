/*
================================================================
Library Of Legends 2.0
Migration: 000031_create_movie_trivia.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Trivia-Einträge
zu Filmen.

Diese Tabelle speichert interessante Informationen,
Produktionsdetails, Fehler, Easter Eggs, Wissenswertes
und sonstige Hintergrundinformationen.

Verwendungszwecke:
- Trivia
- Fun Facts
- Produktionsdetails
- Goofs
- Easter Eggs
- Wissenswertes
- Hintergrundinformationen
- Archivinformationen

Erstellt:
- movie_trivia

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_trivia
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    title TEXT,

    trivia TEXT NOT NULL,

    trivia_type TEXT NOT NULL,

    language TEXT,

    source TEXT,

    source_url TEXT,

    submitted_by TEXT,

    is_spoiler INTEGER NOT NULL DEFAULT 0,

    is_verified INTEGER NOT NULL DEFAULT 0,

    is_featured INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_movie
ON movie_trivia(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_type
ON movie_trivia(trivia_type);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_language
ON movie_trivia(language);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_source
ON movie_trivia(source);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_spoiler
ON movie_trivia(is_spoiler);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_verified
ON movie_trivia(is_verified);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_featured
ON movie_trivia(is_featured);

CREATE INDEX IF NOT EXISTS idx_movie_trivia_sort
ON movie_trivia(sort_order);

COMMIT;