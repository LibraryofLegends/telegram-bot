/*
================================================================
Library Of Legends 2.0
Migration: 000045_create_movie_jobs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Job-Queue für sämtliche
Hintergrundprozesse innerhalb von Library Of Legends.

Diese Tabelle verwaltet asynchrone Aufgaben wie:

- TMDb Synchronisation
- IMDb Synchronisation
- OMDb Synchronisation
- Telegram Synchronisation
- Cover Download
- Backdrop Download
- Trailer Download
- Videoanalyse
- Medienimport
- Dublettenprüfung
- Metadatenaktualisierung
- Statistikberechnung
- Thumbnail-Erstellung
- Bibliotheksprüfung
- Datenbereinigung
- Hintergrundwartung

Erstellt:
- movie_jobs

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_jobs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    job_type TEXT NOT NULL,

    queue_name TEXT NOT NULL DEFAULT 'default',

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'pending',

    payload TEXT,

    result TEXT,

    error_message TEXT,

    stack_trace TEXT,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retries INTEGER NOT NULL DEFAULT 3,

    progress INTEGER NOT NULL DEFAULT 0,

    worker_name TEXT,

    created_by TEXT,

    scheduled_at DATETIME,

    started_at DATETIME,

    finished_at DATETIME,

    cancelled_at DATETIME,

    timeout_seconds INTEGER DEFAULT 3600,

    execution_time_ms INTEGER,

    locked_at DATETIME,

    lock_token TEXT,

    correlation_id TEXT,

    parent_job_uuid TEXT,

    tags TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_status
ON movie_jobs(status);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_priority
ON movie_jobs(priority);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_queue
ON movie_jobs(queue_name);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_type
ON movie_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_scheduled
ON movie_jobs(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_started
ON movie_jobs(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_finished
ON movie_jobs(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_worker
ON movie_jobs(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_retry
ON movie_jobs(retry_count);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_parent
ON movie_jobs(parent_job_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_correlation
ON movie_jobs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_jobs_lock
ON movie_jobs(lock_token);

COMMIT;