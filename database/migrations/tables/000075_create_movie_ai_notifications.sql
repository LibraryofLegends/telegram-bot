/*
================================================================
Library Of Legends 2.0
Migration: 000075_create_movie_ai_notifications.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Benachrichtigungssystem
für sämtliche internen und externen
Benachrichtigungen innerhalb von
Library Of Legends.

Diese Tabelle verwaltet Systemmeldungen,
Telegram-Nachrichten, E-Mails, Webhooks,
Push-Benachrichtigungen sowie zukünftige
Benachrichtigungskanäle.

Unterstützte Funktionen:
- Mehrere Versandkanäle
- Prioritäten
- Zeitplanung
- Retry-System
- Zustellstatus
- Empfangsbestätigungen
- Fehlerprotokollierung
- Benachrichtigungsverlauf

Erstellt:
- movie_ai_notifications

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

CREATE TABLE IF NOT EXISTS movie_ai_notifications
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    notification_uuid TEXT NOT NULL UNIQUE,

    event_id INTEGER,

    agent_id INTEGER,

    workflow_id INTEGER,

    notification_type TEXT NOT NULL,

    notification_channel TEXT NOT NULL,

    priority INTEGER NOT NULL DEFAULT 100,

    recipient_type TEXT,

    recipient_id TEXT,

    recipient_address TEXT,

    subject TEXT,

    title TEXT,

    message TEXT,

    payload TEXT,

    attachment_count INTEGER NOT NULL DEFAULT 0,

    scheduled_at DATETIME,

    sent_at DATETIME,

    delivered_at DATETIME,

    read_at DATETIME,

    expires_at DATETIME,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retries INTEGER NOT NULL DEFAULT 3,

    delivery_attempts INTEGER NOT NULL DEFAULT 0,

    delivery_status TEXT NOT NULL DEFAULT 'pending',

    error_code TEXT,

    error_message TEXT,

    provider_response TEXT,

    correlation_id TEXT,

    metadata TEXT,

    is_important INTEGER NOT NULL DEFAULT 0,

    is_read INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id)
        REFERENCES movie_ai_events(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_uuid
ON movie_ai_notifications(notification_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_event
ON movie_ai_notifications(event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_agent
ON movie_ai_notifications(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_workflow
ON movie_ai_notifications(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_type
ON movie_ai_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_channel
ON movie_ai_notifications(notification_channel);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_priority
ON movie_ai_notifications(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_recipient
ON movie_ai_notifications(recipient_type, recipient_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_status
ON movie_ai_notifications(delivery_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_scheduled
ON movie_ai_notifications(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_sent
ON movie_ai_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_delivered
ON movie_ai_notifications(delivered_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_read
ON movie_ai_notifications(read_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_retry
ON movie_ai_notifications(retry_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_active
ON movie_ai_notifications(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_notifications_created
ON movie_ai_notifications(created_at);

COMMIT;