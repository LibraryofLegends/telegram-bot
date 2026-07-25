/*
================================================================
Library Of Legends 2.0
Migration: 000077_create_movie_ai_scheduler_runs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Ausführungshistorie sämtlicher
Scheduler-Jobs innerhalb von Library Of Legends.

Diese Tabelle protokolliert jede geplante oder
manuell gestartete Scheduler-Ausführung
inklusive Laufzeiten, Status, Workflow,
Agent, Retry-Informationen, Fehlern und
Ergebnissen.

Erstellt:
- movie_ai_scheduler_runs

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000076_create_movie_ai_scheduler.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_scheduler_runs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    run_uuid TEXT NOT NULL UNIQUE,

    scheduler_id INTEGER NOT NULL,

    workflow_id INTEGER,

    agent_id INTEGER,

    trigger_source TEXT NOT NULL DEFAULT 'scheduler',

    execution_mode TEXT NOT NULL DEFAULT 'automatic',

    scheduled_for DATETIME,

    started_at DATETIME,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    status TEXT NOT NULL DEFAULT 'pending',

    success INTEGER NOT NULL DEFAULT 1,

    retry_count INTEGER NOT NULL DEFAULT 0,

    timeout_seconds INTEGER,

    cancelled_at DATETIME,

    cancelled_by TEXT,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    execution_summary TEXT,

    execution_result TEXT,

    execution_log TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (scheduler_id)
        REFERENCES movie_ai_scheduler(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_scheduler
ON movie_ai_scheduler_runs(scheduler_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_workflow
ON movie_ai_scheduler_runs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_agent
ON movie_ai_scheduler_runs(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_uuid
ON movie_ai_scheduler_runs(run_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_status
ON movie_ai_scheduler_runs(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_trigger
ON movie_ai_scheduler_runs(trigger_source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_execution_mode
ON movie_ai_scheduler_runs(execution_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_scheduled
ON movie_ai_scheduler_runs(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_started
ON movie_ai_scheduler_runs(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_finished
ON movie_ai_scheduler_runs(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_success
ON movie_ai_scheduler_runs(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_retry
ON movie_ai_scheduler_runs(retry_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_runtime
ON movie_ai_scheduler_runs(execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_scheduler_runs_created
ON movie_ai_scheduler_runs(created_at);

COMMIT;