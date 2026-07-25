/*
================================================================
Library Of Legends 2.0
Migration: 000004_create_movie_genres.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und Genres.

Ein Film kann mehreren Genres angehören.
Ein Genre kann mehreren Filmen zugeordnet sein.

Diese Tabelle bildet die Many-to-Many-Beziehung
zwischen movies und genres.

Erstellt:
- movie_genres

Abhängigkeiten:
- 000002_create_movies.sql
- 000003_create_genres.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_genres
(
    movie_id INTEGER NOT NULL,

    genre_id INTEGER NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY
    (
        movie_id,
        genre_id
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (genre_id)
        REFERENCES genres(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_genres_movie
ON movie_genres(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_genres_genre
ON movie_genres(genre_id);

COMMIT;