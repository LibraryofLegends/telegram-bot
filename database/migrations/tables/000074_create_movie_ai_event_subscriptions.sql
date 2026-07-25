/*
================================================================
Library Of Legends 2.0
Migration: 000074_create_movie_ai_event_subscriptions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung sämtlicher
Event-Abonnements innerhalb von
Library Of Legends.

Diese Tabelle definiert, welche Agenten,
Workflows oder Systemkomponenten auf
bestimmte Ereignisse reagieren.

Unterstützte Funktionen:
- Event-Filter
- Wildcard-Abonnements
- Prioritäten
- Retry-Regeln
- Dead-Letter-Unterstützung
- Ereignisrouting
- Aktivierung/Deaktivierung
- Individuelle Konfiguration

Erstellt:
- movie_ai_event_subscriptions

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000073_create_movie_ai_events.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_event_subscriptions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    subscription_uuid TEXT NOT NULL UNIQUE,

    subscription_name TEXT NOT NULL,

    subscriber_type TEXT NOT NULL,

    agent_id INTEGER,

    workflow_id INTEGER,

    event_name TEXT,

    event_type TEXT,

    event_category TEXT,

    event_pattern TEXT,

    filter_expression TEXT,

    priority INTEGER NOT NULL DEFAULT 100,

    execution_mode TEXT NOT NULL DEFAULT 'synchronous',

    retry_attempts INTEGER NOT NULL DEFAULT 3,

    retry_delay_ms INTEGER NOT NULL DEFAULT 1000,

    timeout_seconds INTEGER NOT NULL DEFAULT 60,

    dead_letter_enabled INTEGER NOT NULL DEFAULT 1,

    dead_letter_queue TEXT,

    max_failures INTEGER NOT NULL DEFAULT 10,

    delivery_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    last_triggered_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    status TEXT NOT NULL DEFAULT 'active',

    configuration TEXT,

    metadata TEXT,

    is_system_subscription INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_uuid
ON movie_ai_event_subscriptions(subscription_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_name
ON movie_ai_event_subscriptions(subscription_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_subscriber
ON movie_ai_event_subscriptions(subscriber_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_agent
ON movie_ai_event_subscriptions(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_workflow
ON movie_ai_event_subscriptions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_event_name
ON movie_ai_event_subscriptions(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_event_type
ON movie_ai_event_subscriptions(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_category
ON movie_ai_event_subscriptions(event_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_pattern
ON movie_ai_event_subscriptions(event_pattern);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_priority
ON movie_ai_event_subscriptions(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_status
ON movie_ai_event_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_active
ON movie_ai_event_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_system
ON movie_ai_event_subscriptions(is_system_subscription);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_last_triggered
ON movie_ai_event_subscriptions(last_triggered_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_event_subscriptions_created
ON movie_ai_event_subscriptions(created_at);

COMMIT;