/*
================================================================
Library Of Legends 2.0
Migration: 000007_create_people.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Personen-Tabelle.

Diese Tabelle speichert alle Personen, die an einem
Medium beteiligt sind. Jede Person wird nur einmal
gespeichert und kann beliebig vielen Medien zugeordnet
werden.

Beispiele:
- Schauspieler
- Regisseure
- Drehbuchautoren
- Produzenten
- Komponisten
- Kameraleute
- Synchronsprecher

Erstellt:
- people

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS people
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    tmdb_person_id INTEGER,

    imdb_person_id TEXT,

    full_name TEXT NOT NULL,

    original_name TEXT,

    sort_name TEXT,

    gender INTEGER,

    birthday DATE,

    deathday DATE,

    place_of_birth TEXT,

    biography TEXT,

    profile_path TEXT,

    homepage TEXT,

    popularity REAL,

    adult INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_people_tmdb
ON people(tmdb_person_id);

CREATE INDEX IF NOT EXISTS idx_people_imdb
ON people(imdb_person_id);

CREATE INDEX IF NOT EXISTS idx_people_name
ON people(full_name);

CREATE INDEX IF NOT EXISTS idx_people_sort_name
ON people(sort_name);

CREATE INDEX IF NOT EXISTS idx_people_birthday
ON people(birthday);

COMMIT;