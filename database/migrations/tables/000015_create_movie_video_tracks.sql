/*
================================================================
Library Of Legends 2.0
Migration: 000015_create_movie_video_tracks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Tabelle für Videospuren von Filmen.

Diese Tabelle speichert sämtliche technischen
Videoinformationen eines Films.

Beispiele:
- HEVC (H.265)
- AVC (H.264)
- AV1
- VP9
- Dolby Vision
- HDR10
- HDR10+
- SDR

Erstellt:
- movie_video_tracks

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_video_tracks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    title TEXT,

    codec TEXT,

    codec_profile TEXT,

    container TEXT,

    resolution_width INTEGER,

    resolution_height INTEGER,

    aspect_ratio TEXT,

    frame_rate REAL,

    scan_type TEXT,

    bitrate INTEGER,

    bit_depth INTEGER,

    chroma_subsampling TEXT,

    color_space TEXT,

    color_range TEXT,

    hdr_format TEXT,

    is_hdr INTEGER NOT NULL DEFAULT 0,

    is_dolby_vision INTEGER NOT NULL DEFAULT 0,

    is_default INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_video_movie
ON movie_video_tracks(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_video_codec
ON movie_video_tracks(codec);

CREATE INDEX IF NOT EXISTS idx_movie_video_container
ON movie_video_tracks(container);

CREATE INDEX IF NOT EXISTS idx_movie_video_resolution
ON movie_video_tracks
(
    resolution_width,
    resolution_height
);

CREATE INDEX IF NOT EXISTS idx_movie_video_hdr
ON movie_video_tracks(is_hdr);

CREATE INDEX IF NOT EXISTS idx_movie_video_dolby_vision
ON movie_video_tracks(is_dolby_vision);

CREATE INDEX IF NOT EXISTS idx_movie_video_default
ON movie_video_tracks(is_default);

COMMIT;