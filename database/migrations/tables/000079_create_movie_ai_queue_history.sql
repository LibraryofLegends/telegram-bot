/*
================================================================
Library Of Legends 2.0
Migration: 000079_create_movie_ai_queue_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die revisionssichere Historie der
zentralen Job-Queue innerhalb von
Library Of Legends.

Diese Tabelle protokolliert sämtliche
Statusänderungen eines Queue-Eintrags
inklusive Worker, Laufzeiten, Fehler,
Retries und Dead-Letter-Ereignissen.

Unterstützte Funktionen:
- Statushistorie
- Retry-Historie
- Dead-Letter-Protokoll
- Worker-Historie
- Fehleranalyse
- Audit-Log
- Performance-Auswertung

Erstellt:
- movie_ai_queue_history

Abhängigkeiten:
- 000078_create_movie_ai_queue.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_queue_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    history_uuid TEXT NOT NULL UNIQUE,

    queue_job_id INTEGER NOT NULL,

    job_uuid TEXT NOT NULL,

    previous_status TEXT,

    current_status TEXT NOT NULL,

    event_type TEXT NOT NULL,

    worker_name TEXT,

    worker_id TEXT,

    execution_node TEXT,

    attempt_number INTEGER NOT NULL DEFAULT 1,

    retry_reason TEXT,

    dead_letter_reason TEXT,

    progress_percent INTEGER NOT NULL DEFAULT 0,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    cpu_time_ms INTEGER,

    memory_usage_mb REAL,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    event_details TEXT,

    metadata TEXT,

    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (queue_job_id)
        REFERENCES movie_ai_queue(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_queue_job
ON movie_ai_queue_history(queue_job_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_job_uuid
ON movie_ai_queue_history(job_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_uuid
ON movie_ai_queue_history(history_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_previous_status
ON movie_ai_queue_history(previous_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_current_status
ON movie_ai_queue_history(current_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_event_type
ON movie_ai_queue_history(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_worker
ON movie_ai_queue_history(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_attempt
ON movie_ai_queue_history(attempt_number);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_progress
ON movie_ai_queue_history(progress_percent);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_execution_time
ON movie_ai_queue_history(execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_queue_wait
ON movie_ai_queue_history(queue_wait_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_error
ON movie_ai_queue_history(error_code);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_occurred
ON movie_ai_queue_history(occurred_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_history_created
ON movie_ai_queue_history(created_at);

COMMIT;