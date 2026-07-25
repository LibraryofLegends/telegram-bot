/*
================================================================
Library Of Legends 2.0
Migration: 000066_create_movie_ai_workflows.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Workflow-Verwaltung für
sämtliche KI-Workflows innerhalb von
Library Of Legends.

Diese Tabelle definiert vollständige
KI-Workflows mit mehreren Agenten,
Ausführungsschritten, Triggern,
Zeitplänen, Bedingungen, Versionierung
und Fehlerbehandlung.

Unterstützte Workflows:
- Medienimport
- Metadatenanalyse
- Übersetzung
- Qualitätskontrolle
- Telegram Publishing
- KI-Empfehlungen
- Batch-Verarbeitung
- Geplante Aufgaben
- Benutzerdefinierte Workflows

Erstellt:
- movie_ai_workflows

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_workflows
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    workflow_name TEXT NOT NULL,

    workflow_slug TEXT NOT NULL UNIQUE,

    display_name TEXT,

    description TEXT,

    category TEXT,

    version TEXT NOT NULL,

    entry_agent_id INTEGER,

    workflow_definition TEXT,

    workflow_graph TEXT,

    trigger_type TEXT,

    trigger_configuration TEXT,

    schedule_expression TEXT,

    execution_mode TEXT NOT NULL DEFAULT 'sequential',

    max_parallel_agents INTEGER DEFAULT 1,

    timeout_seconds INTEGER DEFAULT 3600,

    retry_attempts INTEGER DEFAULT 3,

    continue_on_error INTEGER NOT NULL DEFAULT 0,

    rollback_enabled INTEGER NOT NULL DEFAULT 0,

    logging_level TEXT DEFAULT 'normal',

    priority INTEGER NOT NULL DEFAULT 100,

    execution_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    average_runtime_ms INTEGER,

    last_execution_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    status TEXT NOT NULL DEFAULT 'draft',

    is_default INTEGER NOT NULL DEFAULT 0,

    is_system INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (entry_agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_name
ON movie_ai_workflows(workflow_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_slug
ON movie_ai_workflows(workflow_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_category
ON movie_ai_workflows(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_agent
ON movie_ai_workflows(entry_agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_trigger
ON movie_ai_workflows(trigger_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_execution
ON movie_ai_workflows(execution_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_priority
ON movie_ai_workflows(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_status
ON movie_ai_workflows(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_active
ON movie_ai_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_system
ON movie_ai_workflows(is_system);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_default
ON movie_ai_workflows(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_last_execution
ON movie_ai_workflows(last_execution_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_workflows_created
ON movie_ai_workflows(created_at);

COMMIT;