/*
================================================================
Library Of Legends 2.0
Migration: 000073_create_movie_ai_events.sql
----------------------------------------------------------------
Beschreibung:
Erstellt den zentralen Event-Bus für sämtliche
Ereignisse innerhalb von Library Of Legends.

Diese Tabelle speichert alle Systemereignisse,
Agenten-Events, Workflow-Events, Import-Events,
Telegram-Events und KI-Events.

Der Event-Bus dient als Grundlage für eine
ereignisgesteuerte Architektur (EDA).

Erstellt:
- movie_ai_events

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000068_create_movie_ai_workflow_runs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_events
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    event_uuid TEXT NOT NULL UNIQUE,

    event_name TEXT NOT NULL,

    event_type TEXT NOT NULL,

    event_category TEXT NOT NULL,

    source_type TEXT NOT NULL,

    source_id INTEGER,

    agent_id INTEGER,

    workflow_id INTEGER,

    workflow_run_id INTEGER,

    parent_event_id INTEGER,

    correlation_id TEXT,

    causation_id TEXT,

    aggregate_id TEXT,

    aggregate_type TEXT,

    priority INTEGER NOT NULL DEFAULT 100,

    event_version TEXT DEFAULT '1.0',

    payload TEXT,

    payload_schema TEXT,

    metadata TEXT,

    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    processed_at DATETIME,

    expires_at DATETIME,

    processing_time_ms INTEGER,

    delivery_attempts INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'pending',

    is_system_event INTEGER NOT NULL DEFAULT 0,

    is_processed INTEGER NOT NULL DEFAULT 0,

    is_failed INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_run_id)
        REFERENCES movie_ai_workflow_runs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (parent_event_id)
        REFERENCES movie_ai_events(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_uuid
ON movie_ai_events(event_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_name
ON movie_ai_events(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_type
ON movie_ai_events(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_category
ON movie_ai_events(event_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_source_type
ON movie_ai_events(source_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_source_id
ON movie_ai_events(source_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_agent
ON movie_ai_events(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_workflow
ON movie_ai_events(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_workflow_run
ON movie_ai_events(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_parent
ON movie_ai_events(parent_event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_correlation
ON movie_ai_events(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_status
ON movie_ai_events(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_priority
ON movie_ai_events(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_published
ON movie_ai_events(published_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_processed
ON movie_ai_events(processed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_system
ON movie_ai_events(is_system_event);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_failed
ON movie_ai_events(is_failed);

CREATE INDEX IF NOT EXISTS idx_movie_ai_events_created
ON movie_ai_events(created_at);

COMMIT;