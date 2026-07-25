/*
================================================================
Library Of Legends 2.0
Migration: 000032_create_movie_soundtracks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Soundtracks,
Filmmusik und einzelne Musiktitel eines Films.

Diese Tabelle dient zur Verwaltung von:
- Original Score
- Soundtrack
- Titelsongs
- Einzelne Musikstücke
- Abspannmusik
- Eröffnungsmusik
- Szenenmusik
- Künstlern und Komponisten

Ein Film kann beliebig viele Musiktitel besitzen.

Erstellt:
- movie_soundtracks

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_soundtracks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    artist TEXT,

    composer TEXT,

    album TEXT,

    music_type TEXT NOT NULL,

    language TEXT,

    genre TEXT,

    duration_seconds INTEGER,

    scene_description TEXT,

    start_time_seconds INTEGER,

    end_time_seconds INTEGER,

    release_year INTEGER,

    source TEXT,

    source_url TEXT,

    spotify_id TEXT,

    apple_music_id TEXT,

    youtube_video_id TEXT,

    is_original_score INTEGER NOT NULL DEFAULT 0,

    is_featured INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_movie
ON movie_soundtracks(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_title
ON movie_soundtracks(title);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_artist
ON movie_soundtracks(artist);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_composer
ON movie_soundtracks(composer);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_type
ON movie_soundtracks(music_type);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_language
ON movie_soundtracks(language);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_genre
ON movie_soundtracks(genre);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_spotify
ON movie_soundtracks(spotify_id);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_apple
ON movie_soundtracks(apple_music_id);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_youtube
ON movie_soundtracks(youtube_video_id);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_featured
ON movie_soundtracks(is_featured);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_original_score
ON movie_soundtracks(is_original_score);

CREATE INDEX IF NOT EXISTS idx_movie_soundtracks_sort
ON movie_soundtracks(sort_order);

COMMIT;