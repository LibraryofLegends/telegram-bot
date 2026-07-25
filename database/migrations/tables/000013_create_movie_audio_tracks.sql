/*
================================================================
Library Of Legends 2.0
Migration: 000013_create_movie_audio_tracks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Tabelle für Audiospuren von Filmen.

Ein Film kann beliebig viele Audiospuren besitzen.

Beispiele:
- Deutsch DTS-HD MA 5.1
- Englisch Dolby Atmos
- Japanisch AAC 2.0
- Französisch Dolby Digital 5.1

Erstellt:
- movie_audio_tracks

Abhängigkeiten:
- 000002_create_movies.sql
- 000012_create_languages.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_audio_tracks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    language_id INTEGER NOT NULL,

    title TEXT,

    codec TEXT,

    format TEXT,

    channels TEXT,

    bitrate INTEGER,

    sample_rate INTEGER,

    is_original INTEGER NOT NULL DEFAULT 0,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_forced INTEGER NOT NULL DEFAULT 0,

    is_commentary INTEGER NOT NULL DEFAULT 0,

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

CREATE INDEX IF NOT EXISTS idx_movie_audio_movie
ON movie_audio_tracks(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_audio_language
ON movie_audio_tracks(language_id);

CREATE INDEX IF NOT EXISTS idx_movie_audio_codec
ON movie_audio_tracks(codec);

CREATE INDEX IF NOT EXISTS idx_movie_audio_format
ON movie_audio_tracks(format);

CREATE INDEX IF NOT EXISTS idx_movie_audio_channels
ON movie_audio_tracks(channels);

CREATE INDEX IF NOT EXISTS idx_movie_audio_original
ON movie_audio_tracks(is_original);

CREATE INDEX IF NOT EXISTS idx_movie_audio_default
ON movie_audio_tracks(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_audio_track_number
ON movie_audio_tracks(track_number);

COMMIT;