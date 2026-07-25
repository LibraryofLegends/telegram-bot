/*
================================================================
Library Of Legends 2.0
Migration: 000076_create_movie_ai_scheduler.sql
----------------------------------------------------------------
Beschreibung:
Erstellt den zentralen Scheduler für sämtliche
zeitgesteuerten Aufgaben innerhalb von
Library Of Legends.

Diese Tabelle verwaltet Cronjobs,
geplante KI-Workflows, automatische
Importe, Veröffentlichungen, Backups,
Health-Checks und weitere periodische
Systemaufgaben.

Unterstützte Funktionen:
- Cron-Ausdrücke
- Einmalige Ausführungen
- Wiederholungen
- Zeitfenster
- Prioritäten
- Retry-Strategien
- Aktivierung
- Scheduler-Konfiguration

Erstellt:
- movie_ai_scheduler

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_scheduler
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    scheduler_uuid TEXT NOT NULL UNIQUE,

    job_name TEXT NOT NULL,

    job_slug TEXT NOT NULL UNIQUE,

    description TEXT,

    workflow_id INTEGER,

    agent_id INTEGER,

    trigger_type TEXT NOT NULL DEFAULT 'cron',

    cron_expression TEXT,

    timezone TEXT DEFAULT 'Europe/Berlin',

    schedule_start DATETIME,

    schedule_end DATETIME,

    next_run_at DATETIME,

    last_run_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    priority INTEGER NOT NULL DEFAULT 100,

    execution_mode TEXT NOT NULL DEFAULT 'automatic',

    max_runtime_seconds INTEGER DEFAULT 3600,

    retry_attempts INTEGER NOT NULL DEFAULT 3,

    retry_delay_ms INTEGER NOT NULL DEFAULT 1000,

    concurrency_limit INTEGER NOT NULL DEFAULT 1,

    run_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    skipped_count INTEGER NOT NULL DEFAULT 0,

    timeout_count INTEGER NOT NULL DEFAULT 0,

    configuration TEXT,

    parameters TEXT,

    metadata TEXT,

    status TEXT NOT NULL DEFAULT 'active',

    is_system_job INTEGER NOT NULL DEFAULT 0,

    is_enabled INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_uuid
ON movie_ai_scheduler(scheduler_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_name
ON movie_ai_scheduler(job_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_slug
ON movie_ai_scheduler(job_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_workflow
ON movie_ai_scheduler(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_agent
ON movie_ai_scheduler(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_trigger
ON movie_ai_scheduler(trigger_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_next_run
ON movie_ai_scheduler(next_run_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_last_run
ON movie_ai_scheduler(last_run_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_priority
ON movie_ai_scheduler(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_status
ON movie_ai_scheduler(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_enabled
ON movie_ai_scheduler(is_enabled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_system
ON movie_ai_scheduler(is_system_job);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_created
ON movie_ai_scheduler(created_at);

COMMIT;