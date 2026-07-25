/*
================================================================
Library Of Legends 2.0
Migration: 000072_create_movie_ai_tool_calls.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das Ausführungsprotokoll sämtlicher
Tool-Aufrufe innerhalb von Library Of Legends.

Diese Tabelle protokolliert jeden einzelnen
Aufruf eines Werkzeugs durch einen KI-Agenten
oder Workflow inklusive Eingaben, Ausgaben,
Laufzeiten, Kosten, Status und Fehlern.

Erstellt:
- movie_ai_tool_calls

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000063_create_movie_ai_agent_tasks.sql
- 000066_create_movie_ai_workflows.sql
- 000068_create_movie_ai_workflow_runs.sql
- 000070_create_movie_ai_tools.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_tool_calls
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    call_uuid TEXT NOT NULL UNIQUE,

    tool_id INTEGER NOT NULL,

    agent_id INTEGER,

    task_id INTEGER,

    workflow_id INTEGER,

    workflow_run_id INTEGER,

    call_name TEXT NOT NULL,

    operation TEXT,

    execution_mode TEXT NOT NULL DEFAULT 'automatic',

    request_payload TEXT,

    response_payload TEXT,

    input_size_bytes INTEGER,

    output_size_bytes INTEGER,

    status TEXT NOT NULL DEFAULT 'pending',

    http_status_code INTEGER,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    cpu_time_ms INTEGER,

    memory_usage_mb REAL,

    estimated_cost REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    retry_count INTEGER NOT NULL DEFAULT 0,

    success INTEGER NOT NULL DEFAULT 1,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    started_at DATETIME,

    finished_at DATETIME,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tool_id)
        REFERENCES movie_ai_tools(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (task_id)
        REFERENCES movie_ai_agent_tasks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_run_id)
        REFERENCES movie_ai_workflow_runs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_tool
ON movie_ai_tool_calls(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_agent
ON movie_ai_tool_calls(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_task
ON movie_ai_tool_calls(task_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_workflow
ON movie_ai_tool_calls(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_workflow_run
ON movie_ai_tool_calls(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_uuid
ON movie_ai_tool_calls(call_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_name
ON movie_ai_tool_calls(call_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_operation
ON movie_ai_tool_calls(operation);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_status
ON movie_ai_tool_calls(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_started
ON movie_ai_tool_calls(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_finished
ON movie_ai_tool_calls(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_success
ON movie_ai_tool_calls(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_runtime
ON movie_ai_tool_calls(execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_cost
ON movie_ai_tool_calls(estimated_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tool_calls_created
ON movie_ai_tool_calls(created_at);

COMMIT;