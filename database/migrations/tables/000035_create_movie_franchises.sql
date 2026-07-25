/*
================================================================
Library Of Legends 2.0
Migration: 000035_create_movie_franchises.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und
Franchises.

Diese Tabelle ermöglicht die Organisation von Filmen
innerhalb beliebiger Filmreihen, Universen und
Franchises.

Beispiele:
- Marvel Cinematic Universe
- DC Universe
- Star Wars
- Harry Potter
- Jurassic Park
- Fast & Furious
- James Bond
- Alien
- Predator
- Mission: Impossible

Ein Film kann mehreren Franchises angehören.
Ein Franchise kann beliebig viele Filme besitzen.

Erstellt:
- movie_franchises

Abhängigkeiten:
- 000002_create_movies.sql
- 000005_create_collections.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_franchises
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    collection_id INTEGER NOT NULL,

    phase TEXT,

    saga TEXT,

    timeline_order INTEGER,

    release_order INTEGER,

    chronological_order INTEGER,

    chapter TEXT,

    notes TEXT,

    is_primary INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        collection_id
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (collection_id)
        REFERENCES collections(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_movie
ON movie_franchises(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_collection
ON movie_franchises(collection_id);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_phase
ON movie_franchises(phase);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_saga
ON movie_franchises(saga);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_timeline
ON movie_franchises(timeline_order);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_release
ON movie_franchises(release_order);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_chronological
ON movie_franchises(chronological_order);

CREATE INDEX IF NOT EXISTS idx_movie_franchises_primary
ON movie_franchises(is_primary);

COMMIT;