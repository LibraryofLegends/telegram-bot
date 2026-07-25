/*
================================================================
Library Of Legends 2.0
Migration: 000008_create_movie_cast.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Besetzungstabelle (Cast) für Filme.

Diese Tabelle verknüpft Filme mit Personen und speichert
deren Rolle innerhalb des Films.

Beispiele:
- Schauspieler
- Synchronsprecher
- Gastauftritte
- Cameos

Erstellt:
- movie_cast

Abhängigkeiten:
- 000002_create_movies.sql
- 000007_create_people.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_cast
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    person_id INTEGER NOT NULL,

    character_name TEXT,

    credit_name TEXT,

    cast_order INTEGER,

    billing_order INTEGER,

    is_lead INTEGER NOT NULL DEFAULT 0,

    is_voice INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        person_id,
        character_name
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (person_id)
        REFERENCES people(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_cast_movie
ON movie_cast(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_cast_person
ON movie_cast(person_id);

CREATE INDEX IF NOT EXISTS idx_movie_cast_character
ON movie_cast(character_name);

CREATE INDEX IF NOT EXISTS idx_movie_cast_credit_name
ON movie_cast(credit_name);

CREATE INDEX IF NOT EXISTS idx_movie_cast_cast_order
ON movie_cast(cast_order);

CREATE INDEX IF NOT EXISTS idx_movie_cast_billing_order
ON movie_cast(billing_order);

CREATE INDEX IF NOT EXISTS idx_movie_cast_is_lead
ON movie_cast(is_lead);

COMMIT;