/*
================================================================
Library Of Legends 2.0
Migration: 000047_create_movie_sync_queue.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Synchronisationswarteschlange
für externe Dienste.

Diese Tabelle verwaltet sämtliche Synchronisations-
aufgaben zwischen Library Of Legends und externen
Datenquellen.

Unterstützte Dienste:
- TMDb
- IMDb
- OMDb
- Fanart.tv
- Cloudinary
- Telegram
- YouTube
- Trakt
- TheTVDB
- Eigene APIs

Erstellt:
- movie_sync_queue

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_sync_queue
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER,

    provider_name TEXT NOT NULL,

    provider_identifier TEXT,

    sync_type TEXT NOT NULL,

    sync_direction TEXT NOT NULL DEFAULT 'pull',

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'pending',

    scheduled_at DATETIME,

    started_at DATETIME,

    finished_at DATETIME,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retries INTEGER NOT NULL DEFAULT 5,

    last_success_at DATETIME,

    last_error_at DATETIME,

    next_retry_at DATETIME,

    checksum TEXT,

    etag TEXT,

    remote_updated_at DATETIME,

    local_updated_at DATETIME,

    request_payload TEXT,

    response_payload TEXT,

    response_code INTEGER,

    error_message TEXT,

    stack_trace TEXT,

    worker_name TEXT,

    correlation_id TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_movie
ON movie_sync_queue(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_provider
ON movie_sync_queue(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_provider_identifier
ON movie_sync_queue(provider_identifier);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_sync_type
ON movie_sync_queue(sync_type);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_direction
ON movie_sync_queue(sync_direction);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_status
ON movie_sync_queue(status);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_priority
ON movie_sync_queue(priority);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_scheduled
ON movie_sync_queue(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_started
ON movie_sync_queue(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_finished
ON movie_sync_queue(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_next_retry
ON movie_sync_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_last_success
ON movie_sync_queue(last_success_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_last_error
ON movie_sync_queue(last_error_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_worker
ON movie_sync_queue(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_sync_queue_correlation
ON movie_sync_queue(correlation_id);

COMMIT;