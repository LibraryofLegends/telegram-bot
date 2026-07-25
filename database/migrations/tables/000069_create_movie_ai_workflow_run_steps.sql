/*
================================================================
Library Of Legends 2.0
Migration: 000069_create_movie_ai_workflow_run_steps.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Ausführungshistorie sämtlicher
Workflow-Schritte innerhalb von
Library Of Legends.

Diese Tabelle protokolliert jeden einzelnen
Schritt einer Workflow-Ausführung inklusive
Agent, Modell, Provider, Laufzeiten,
Tokenverbrauch, Kosten, Ein- und Ausgaben,
Status sowie Fehlerinformationen.

Erstellt:
- movie_ai_workflow_run_steps

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000067_create_movie_ai_workflow_steps.sql
- 000068_create_movie_ai_workflow_runs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_workflow_run_steps
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    workflow_run_id INTEGER NOT NULL,

    workflow_step_id INTEGER NOT NULL,

    agent_id INTEGER,

    provider_id INTEGER,

    model_id INTEGER,

    run_step_uuid TEXT NOT NULL UNIQUE,

    execution_order INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    execution_mode TEXT DEFAULT 'automatic',

    started_at DATETIME,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    input_tokens INTEGER NOT NULL DEFAULT 0,

    output_tokens INTEGER NOT NULL DEFAULT 0,

    reasoning_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    estimated_cost REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    retry_count INTEGER NOT NULL DEFAULT 0,

    success INTEGER NOT NULL DEFAULT 1,

    input_data TEXT,

    output_data TEXT,

    result_summary TEXT,

    execution_log TEXT,

    warning_message TEXT,

    error_code TEXT,

    error_message TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workflow_run_id)
        REFERENCES movie_ai_workflow_runs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_step_id)
        REFERENCES movie_ai_workflow_steps(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
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

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_workflow_run
ON movie_ai_workflow_run_steps(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_workflow_step
ON movie_ai_workflow_run_steps(workflow_step_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_agent
ON movie_ai_workflow_run_steps(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_provider
ON movie_ai_workflow_run_steps(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_model
ON movie_ai_workflow_run_steps(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_uuid
ON movie_ai_workflow_run_steps(run_step_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_order
ON movie_ai_workflow_run_steps(execution_order);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_status
ON movie_ai_workflow_run_steps(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_started
ON movie_ai_workflow_run_steps(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_finished
ON movie_ai_workflow_run_steps(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_success
ON movie_ai_workflow_run_steps(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_tokens
ON movie_ai_workflow_run_steps(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_cost
ON movie_ai_workflow_run_steps(estimated_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_run_steps_created
ON movie_ai_workflow_run_steps(created_at);

COMMIT;