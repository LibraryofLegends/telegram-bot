/*
================================================================
Library Of Legends 2.0
Migration: 000021_create_movie_tags.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und Tags.

Ein Film kann beliebig viele Tags besitzen.
Ein Tag kann beliebig vielen Filmen zugeordnet werden.

Beispiele:
- Oscar-Gewinner
- Alien
- Dinosaurier
- Weihnachten
- Zeitreise
- Weltraum
- Kultfilm
- Klassiker

Erstellt:
- movie_tags

Abhängigkeiten:
- 000002_create_movies.sql
- 000020_create_tags.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_tags
(
    movie_id INTEGER NOT NULL,

    tag_id INTEGER NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY
    (
        movie_id,
        tag_id
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_tags_movie
ON movie_tags(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_tags_tag
ON movie_tags(tag_id);

COMMIT;