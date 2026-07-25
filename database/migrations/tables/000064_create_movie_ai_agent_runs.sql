/*
================================================================
Library Of Legends 2.0
Migration: 000064_create_movie_ai_agent_runs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Ausführungsprotokoll
sämtlicher KI-Agenten.

Diese Tabelle speichert jeden einzelnen
Agentenlauf inklusive Laufzeit, verwendeter
Modelle, Provider, Kosten, Tokenverbrauch,
Fehler und Performance-Metriken.

Erstellt:
- movie_ai_agent_runs

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000063_create_movie_ai_agent_tasks.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_agent_runs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    run_uuid TEXT NOT NULL UNIQUE,

    agent_id INTEGER NOT NULL,

    task_id INTEGER,

    provider_id INTEGER,

    model_id INTEGER,

    run_status TEXT NOT NULL DEFAULT 'pending',

    execution_mode TEXT DEFAULT 'automatic',

    trigger_source TEXT,

    started_at DATETIME NOT NULL,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    queue_wait_ms INTEGER,

    input_tokens INTEGER NOT NULL DEFAULT 0,

    output_tokens INTEGER NOT NULL DEFAULT 0,

    reasoning_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    estimated_cost REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    memory_usage_mb REAL,

    cpu_usage_percent REAL,

    success INTEGER NOT NULL DEFAULT 1,

    retry_count INTEGER NOT NULL DEFAULT 0,

    error_code TEXT,

    error_message TEXT,

    warning_message TEXT,

    input_summary TEXT,

    output_summary TEXT,

    execution_log TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (task_id)
        REFERENCES movie_ai_agent_tasks(id)
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

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_agent
ON movie_ai_agent_runs(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_task
ON movie_ai_agent_runs(task_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_provider
ON movie_ai_agent_runs(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_model
ON movie_ai_agent_runs(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_uuid
ON movie_ai_agent_runs(run_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_status
ON movie_ai_agent_runs(run_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_mode
ON movie_ai_agent_runs(execution_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_started
ON movie_ai_agent_runs(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_finished
ON movie_ai_agent_runs(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_success
ON movie_ai_agent_runs(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_tokens
ON movie_ai_agent_runs(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_cost
ON movie_ai_agent_runs(estimated_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_retry
ON movie_ai_agent_runs(retry_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_runs_created
ON movie_ai_agent_runs(created_at);

COMMIT;