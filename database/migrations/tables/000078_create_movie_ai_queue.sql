/*
================================================================
Library Of Legends 2.0
Migration: 000078_create_movie_ai_queue.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Job-Queue für sämtliche
asynchronen Aufgaben innerhalb von
Library Of Legends.

Diese Tabelle verwaltet alle Hintergrundjobs,
KI-Anfragen, Medienimporte, Telegram-
Veröffentlichungen, Benachrichtigungen,
Bildverarbeitung sowie weitere asynchrone
Systemprozesse.

Unterstützte Funktionen:
- Mehrere Warteschlangen
- Prioritäten
- Delayed Jobs
- Retry-System
- Dead-Letter-Queue
- Worker-Zuweisung
- Locking
- Timeout-Verwaltung
- Statusverwaltung

Erstellt:
- movie_ai_queue

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000063_create_movie_ai_agent_tasks.sql
- 000066_create_movie_ai_workflows.sql
================================================================
Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_queue
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    job_uuid TEXT NOT NULL UNIQUE,

    queue_name TEXT NOT NULL,

    job_name TEXT NOT NULL,

    job_type TEXT NOT NULL,

    workflow_id INTEGER,

    task_id INTEGER,

    agent_id INTEGER,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'queued',

    payload TEXT,

    result TEXT,

    delay_until DATETIME,

    available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reserved_at DATETIME,

    started_at DATETIME,

    finished_at DATETIME,

    worker_name TEXT,

    worker_id TEXT,

    execution_node TEXT,

    attempt_count INTEGER NOT NULL DEFAULT 0,

    max_attempts INTEGER NOT NULL DEFAULT 3,

    retry_delay_ms INTEGER NOT NULL DEFAULT 1000,

    timeout_seconds INTEGER NOT NULL DEFAULT 300,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    progress_percent INTEGER NOT NULL DEFAULT 0,

    dead_letter_reason TEXT,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    correlation_id TEXT,

    metadata TEXT,

    is_dead_letter INTEGER NOT NULL DEFAULT 0,

    is_locked INTEGER NOT NULL DEFAULT 0,

    is_cancelled INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (task_id)
        REFERENCES movie_ai_agent_tasks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_uuid
ON movie_ai_queue(job_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_queue
ON movie_ai_queue(queue_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_name
ON movie_ai_queue(job_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_type
ON movie_ai_queue(job_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_workflow
ON movie_ai_queue(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_task
ON movie_ai_queue(task_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_agent
ON movie_ai_queue(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_status
ON movie_ai_queue(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_priority
ON movie_ai_queue(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_available
ON movie_ai_queue(available_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_reserved
ON movie_ai_queue(reserved_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_started
ON movie_ai_queue(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_finished
ON movie_ai_queue(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_worker
ON movie_ai_queue(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_dead_letter
ON movie_ai_queue(is_dead_letter);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_locked
ON movie_ai_queue(is_locked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_cancelled
ON movie_ai_queue(is_cancelled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_correlation
ON movie_ai_queue(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_queue_created
ON movie_ai_queue(created_at);

COMMIT;