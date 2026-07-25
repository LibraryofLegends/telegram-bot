/*
================================================================
Library Of Legends 2.0
Migration: 000068_create_movie_ai_workflow_runs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Ausführungshistorie sämtlicher
KI-Workflows innerhalb von Library Of Legends.

Diese Tabelle protokolliert jede vollständige
Workflow-Ausführung inklusive Status,
Laufzeiten, beteiligter Agenten,
Tokenverbrauch, Kosten und Ergebnisse.

Erstellt:
- movie_ai_workflow_runs

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_workflow_runs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    run_uuid TEXT NOT NULL UNIQUE,

    workflow_id INTEGER NOT NULL,

    trigger_agent_id INTEGER,

    provider_id INTEGER,

    model_id INTEGER,

    workflow_version TEXT,

    execution_mode TEXT NOT NULL DEFAULT 'automatic',

    trigger_type TEXT,

    trigger_source TEXT,

    started_at DATETIME NOT NULL,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    status TEXT NOT NULL DEFAULT 'pending',

    completed_steps INTEGER NOT NULL DEFAULT 0,

    failed_steps INTEGER NOT NULL DEFAULT 0,

    skipped_steps INTEGER NOT NULL DEFAULT 0,

    total_steps INTEGER NOT NULL DEFAULT 0,

    total_input_tokens INTEGER NOT NULL DEFAULT 0,

    total_output_tokens INTEGER NOT NULL DEFAULT 0,

    total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    estimated_cost REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    success INTEGER NOT NULL DEFAULT 1,

    retry_count INTEGER NOT NULL DEFAULT 0,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    input_parameters TEXT,

    execution_summary TEXT,

    workflow_result TEXT,

    execution_log TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (trigger_agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_workflow
ON movie_ai_workflow_runs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_agent
ON movie_ai_workflow_runs(trigger_agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_provider
ON movie_ai_workflow_runs(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_model
ON movie_ai_workflow_runs(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_uuid
ON movie_ai_workflow_runs(run_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_status
ON movie_ai_workflow_runs(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_mode
ON movie_ai_workflow_runs(execution_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_trigger
ON movie_ai_workflow_runs(trigger_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_started
ON movie_ai_workflow_runs(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_finished
ON movie_ai_workflow_runs(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_success
ON movie_ai_workflow_runs(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_tokens
ON movie_ai_workflow_runs(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_cost
ON movie_ai_workflow_runs(estimated_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_runs_created
ON movie_ai_workflow_runs(created_at);

COMMIT;