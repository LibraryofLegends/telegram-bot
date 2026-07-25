/*
================================================================
Library Of Legends 2.0
Migration: 000014_create_movie_subtitles.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Tabelle für Untertitelspuren von Filmen.

Ein Film kann beliebig viele Untertitelspuren besitzen.

Beispiele:
- Deutsch (SRT)
- Englisch (PGS)
- Französisch (ASS)
- Japanisch (VobSub)
- Forced Subtitle
- SDH (Hörgeschädigte)

Erstellt:
- movie_subtitles

Abhängigkeiten:
- 000002_create_movies.sql
- 000012_create_languages.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_subtitles
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    language_id INTEGER NOT NULL,

    title TEXT,

    format TEXT,

    encoding TEXT,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_forced INTEGER NOT NULL DEFAULT 0,

    is_sdh INTEGER NOT NULL DEFAULT 0,

    is_external INTEGER NOT NULL DEFAULT 0,

    file_path TEXT,

    track_number INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        language_id,
        track_number
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (language_id)
        REFERENCES languages(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_movie
ON movie_subtitles(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_language
ON movie_subtitles(language_id);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_format
ON movie_subtitles(format);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_default
ON movie_subtitles(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_forced
ON movie_subtitles(is_forced);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_sdh
ON movie_subtitles(is_sdh);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_external
ON movie_subtitles(is_external);

CREATE INDEX IF NOT EXISTS idx_movie_subtitles_track
ON movie_subtitles(track_number);

COMMIT;