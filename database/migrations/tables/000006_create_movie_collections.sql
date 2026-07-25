/*
================================================================
Library Of Legends 2.0
Migration: 000006_create_movie_collections.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und
Collections.

Ein Film kann mehreren Collections angehören.
Eine Collection kann mehrere Filme enthalten.

Beispiele:
- Marvel Cinematic Universe
- Star Wars
- Harry Potter
- Jurassic Park
- Fast & Furious
- Disney Meisterwerke

Erstellt:
- movie_collections

Abhängigkeiten:
- 000002_create_movies.sql
- 000005_create_collections.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_collections
(
    movie_id INTEGER NOT NULL,

    collection_id INTEGER NOT NULL,

    position INTEGER,

    is_primary INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY
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

CREATE INDEX IF NOT EXISTS idx_movie_collections_movie
ON movie_collections(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_collection
ON movie_collections(collection_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_position
ON movie_collections(position);

CREATE INDEX IF NOT EXISTS idx_movie_collections_primary
ON movie_collections(is_primary);

COMMIT;