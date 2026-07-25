/*
================================================================
Library Of Legends 2.0
Migration: 000024_create_movie_files.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Dateitabelle für Filme.

Diese Tabelle verwaltet die eigentlichen Videodateien,
unabhängig von den Filminformationen.

Sie bildet die Grundlage für:
- Telegram Userbot Import
- Telegram File-ID
- Mehrere Versionen eines Films
- Qualitätsverwaltung
- Duplikaterkennung
- Prüfsummen
- Dateiverwaltung

Erstellt:
- movie_files

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_files
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    telegram_file_id TEXT,

    telegram_unique_id TEXT,

    file_name TEXT NOT NULL,

    original_file_name TEXT,

    file_extension TEXT,

    container TEXT,

    source TEXT,

    quality TEXT,

    resolution TEXT,

    video_codec TEXT,

    audio_codec TEXT,

    audio_channels TEXT,

    hdr_format TEXT,

    file_size INTEGER NOT NULL,

    duration_seconds INTEGER,

    checksum_md5 TEXT,

    checksum_sha256 TEXT,

    mime_type TEXT,

    storage_provider TEXT,

    storage_path TEXT,

    storage_url TEXT,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_verified_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_files_movie
ON movie_files(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_files_uuid
ON movie_files(uuid);

CREATE INDEX IF NOT EXISTS idx_movie_files_telegram_file
ON movie_files(telegram_file_id);

CREATE INDEX IF NOT EXISTS idx_movie_files_telegram_unique
ON movie_files(telegram_unique_id);

CREATE INDEX IF NOT EXISTS idx_movie_files_filename
ON movie_files(file_name);

CREATE INDEX IF NOT EXISTS idx_movie_files_quality
ON movie_files(quality);

CREATE INDEX IF NOT EXISTS idx_movie_files_resolution
ON movie_files(resolution);

CREATE INDEX IF NOT EXISTS idx_movie_files_source
ON movie_files(source);

CREATE INDEX IF NOT EXISTS idx_movie_files_filesize
ON movie_files(file_size);

CREATE INDEX IF NOT EXISTS idx_movie_files_md5
ON movie_files(checksum_md5);

CREATE INDEX IF NOT EXISTS idx_movie_files_sha256
ON movie_files(checksum_sha256);

CREATE INDEX IF NOT EXISTS idx_movie_files_default
ON movie_files(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_files_active
ON movie_files(is_active);

COMMIT;