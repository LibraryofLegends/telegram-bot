/*
================================================================
Library Of Legends 2.0
Migration: 000111_create_movie_ai_event_bus.sql
----------------------------------------------------------------
Beschreibung:
Erstellt den zentralen Event Bus für
Library Of Legends.

Diese Tabelle dient als zentrale
Kommunikationsschicht für sämtliche
ereignisgesteuerten Prozesse innerhalb
des Systems.

Der Event Bus verbindet AI-Agenten,
Workflows, Telegram, Importer,
Webhooks, Scheduler und externe
Provider.

Unterstützte Funktionen:
- Event Bus
- Event Routing
- Publish / Subscribe
- Prioritäten
- Topics
- Event Versionierung
- Correlation IDs
- Replay Support
- Event Scheduling
- Audit

Erstellt:
- movie_ai_event_bus

Abhängigkeiten:
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_event_bus
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    event_uuid TEXT NOT NULL UNIQUE,

    event_name TEXT NOT NULL,

    event_category TEXT NOT NULL,

    event_type TEXT NOT NULL,

    event_version TEXT NOT NULL DEFAULT '1.0',

    topic TEXT NOT NULL,

    routing_key TEXT,

    source_system TEXT NOT NULL,

    source_component TEXT,

    target_system TEXT,

    target_component TEXT,

    provider_id INTEGER,

    workflow_id INTEGER,

    agent_id INTEGER,

    correlation_id TEXT,

    causation_id TEXT,

    parent_event_uuid TEXT,

    payload TEXT,

    payload_checksum TEXT,

    payload_version TEXT,

    content_type TEXT NOT NULL DEFAULT 'application/json',

    priority INTEGER NOT NULL DEFAULT 100,

    delivery_mode TEXT NOT NULL DEFAULT 'async',

    scheduled_at DATETIME,

    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME,

    replayable INTEGER NOT NULL DEFAULT 1,

    replay_count INTEGER NOT NULL DEFAULT 0,

    replayed_at DATETIME,

    status TEXT NOT NULL DEFAULT 'published',

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
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

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_uuid
ON movie_ai_event_bus(event_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_name
ON movie_ai_event_bus(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_category
ON movie_ai_event_bus(event_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_type
ON movie_ai_event_bus(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_topic
ON movie_ai_event_bus(topic);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_routing_key
ON movie_ai_event_bus(routing_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_provider
ON movie_ai_event_bus(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_workflow
ON movie_ai_event_bus(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_agent
ON movie_ai_event_bus(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_correlation
ON movie_ai_event_bus(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_status
ON movie_ai_event_bus(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_priority
ON movie_ai_event_bus(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_published
ON movie_ai_event_bus(published_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_created
ON movie_ai_event_bus(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_bus_updated
ON movie_ai_event_bus(updated_at);

COMMIT;