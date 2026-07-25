/*
================================================================
Library Of Legends 2.0
Migration: 000023_create_movie_countries.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und Ländern.

Ein Film kann mehreren Ländern zugeordnet werden.
Ein Land kann an mehreren Filmen beteiligt sein.

Verwendungszwecke:
- Produktionsland
- Drehland
- Herkunftsland
- Veröffentlichungsland
- Koproduktion

Erstellt:
- movie_countries

Abhängigkeiten:
- 000002_create_movies.sql
- 000022_create_countries.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_countries
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    country_id INTEGER NOT NULL,

    relation_type TEXT NOT NULL DEFAULT 'production',

    is_primary INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        country_id,
        relation_type
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (country_id)
        REFERENCES countries(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_countries_movie
ON movie_countries(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_countries_country
ON movie_countries(country_id);

CREATE INDEX IF NOT EXISTS idx_movie_countries_relation
ON movie_countries(relation_type);

CREATE INDEX IF NOT EXISTS idx_movie_countries_primary
ON movie_countries(is_primary);

COMMIT;