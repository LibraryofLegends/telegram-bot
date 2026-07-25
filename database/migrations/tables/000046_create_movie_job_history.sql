/*
================================================================
Library Of Legends 2.0
Migration: 000046_create_movie_job_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historien-Tabelle für sämtliche
Hintergrundjobs.

Diese Tabelle speichert jede Ausführung eines Jobs
dauerhaft und dient der vollständigen
Nachvollziehbarkeit aller Worker-Aktivitäten.

Erfasste Informationen:
- Statuswechsel
- Job-Ausführung
- Worker
- Laufzeiten
- Wiederholungsversuche
- Fehler
- Parameter
- Ergebnisse
- Systemmeldungen

Erstellt:
- movie_job_history

Abhängigkeiten:
- 000045_create_movie_jobs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_job_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    job_id INTEGER NOT NULL,

    job_uuid TEXT NOT NULL,

    execution_number INTEGER NOT NULL DEFAULT 1,

    previous_status TEXT,

    current_status TEXT NOT NULL,

    worker_name TEXT,

    queue_name TEXT,

    priority INTEGER,

    retry_number INTEGER NOT NULL DEFAULT 0,

    started_at DATETIME,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    exit_code INTEGER,

    result TEXT,

    error_message TEXT,

    stack_trace TEXT,

    payload_snapshot TEXT,

    metadata_snapshot TEXT,

    correlation_id TEXT,

    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_id)
        REFERENCES movie_jobs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_job
ON movie_job_history(job_id);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_job_uuid
ON movie_job_history(job_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_status
ON movie_job_history(current_status);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_worker
ON movie_job_history(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_queue
ON movie_job_history(queue_name);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_retry
ON movie_job_history(retry_number);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_started
ON movie_job_history(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_finished
ON movie_job_history(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_execution
ON movie_job_history(execution_number);

CREATE INDEX IF NOT EXISTS idx_movie_job_history_correlation
ON movie_job_history(correlation_id);

COMMIT;