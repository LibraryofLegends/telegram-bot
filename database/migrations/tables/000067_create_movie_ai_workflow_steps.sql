/*
================================================================
Library Of Legends 2.0
Migration: 000067_create_movie_ai_workflow_steps.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Workflow-Schrittverwaltung für
sämtliche KI-Workflows innerhalb von
Library Of Legends.

Diese Tabelle definiert jeden einzelnen
Workflow-Schritt inklusive Reihenfolge,
Agentenzuweisung, Bedingungen,
Verzweigungen, Wiederholungen,
Timeouts und Fehlerbehandlung.

Erstellt:
- movie_ai_workflow_steps

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_workflow_steps
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    workflow_id INTEGER NOT NULL,

    agent_id INTEGER,

    step_uuid TEXT NOT NULL UNIQUE,

    step_name TEXT NOT NULL,

    step_slug TEXT,

    description TEXT,

    step_order INTEGER NOT NULL,

    execution_type TEXT NOT NULL DEFAULT 'task',

    input_mapping TEXT,

    output_mapping TEXT,

    condition_expression TEXT,

    success_step_id INTEGER,

    failure_step_id INTEGER,

    retry_step_id INTEGER,

    loop_step_id INTEGER,

    timeout_seconds INTEGER DEFAULT 300,

    retry_attempts INTEGER DEFAULT 3,

    continue_on_failure INTEGER NOT NULL DEFAULT 0,

    rollback_on_failure INTEGER NOT NULL DEFAULT 0,

    parallel_execution INTEGER NOT NULL DEFAULT 0,

    wait_for_completion INTEGER NOT NULL DEFAULT 1,

    optional_step INTEGER NOT NULL DEFAULT 0,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'active',

    configuration TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (success_step_id)
        REFERENCES movie_ai_workflow_steps(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (failure_step_id)
        REFERENCES movie_ai_workflow_steps(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (retry_step_id)
        REFERENCES movie_ai_workflow_steps(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (loop_step_id)
        REFERENCES movie_ai_workflow_steps(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_workflow
ON movie_ai_workflow_steps(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_agent
ON movie_ai_workflow_steps(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_uuid
ON movie_ai_workflow_steps(step_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_name
ON movie_ai_workflow_steps(step_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_slug
ON movie_ai_workflow_steps(step_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_order
ON movie_ai_workflow_steps(step_order);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_execution
ON movie_ai_workflow_steps(execution_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_priority
ON movie_ai_workflow_steps(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_status
ON movie_ai_workflow_steps(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_parallel
ON movie_ai_workflow_steps(parallel_execution);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_optional
ON movie_ai_workflow_steps(optional_step);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_success
ON movie_ai_workflow_steps(success_step_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_failure
ON movie_ai_workflow_steps(failure_step_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflow_steps_created
ON movie_ai_workflow_steps(created_at);

COMMIT;