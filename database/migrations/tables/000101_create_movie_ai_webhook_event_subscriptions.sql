/*
================================================================
Library Of Legends 2.0
Migration: 000101_create_movie_ai_webhook_event_subscriptions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnung zwischen Webhooks
und registrierten Ereignissen.

Diese Tabelle definiert, welche Webhooks
auf welche Ereignisse reagieren und
welche Filter-, Zustell- und
Prioritätsregeln dabei gelten.

Unterstützte Funktionen:
- Event-Abonnements
- Event-Routing
- Prioritäten
- Filterregeln
- Bedingte Ausführung
- Aktivierung
- Retry-Konfiguration
- Audit
- Metadaten

Erstellt:
- movie_ai_webhook_event_subscriptions

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql
- 000100_create_movie_ai_webhook_events.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_event_subscriptions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    subscription_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER NOT NULL,

    event_id INTEGER NOT NULL,

    subscription_name TEXT NOT NULL,

    description TEXT,

    event_filter TEXT,

    filter_expression TEXT,

    condition_expression TEXT,

    priority TEXT NOT NULL DEFAULT 'normal',

    execution_order INTEGER NOT NULL DEFAULT 0,

    delivery_mode TEXT NOT NULL DEFAULT 'async',

    retry_enabled INTEGER NOT NULL DEFAULT 1,

    max_retry_attempts INTEGER NOT NULL DEFAULT 5,

    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,

    timeout_seconds INTEGER NOT NULL DEFAULT 30,

    stop_on_failure INTEGER NOT NULL DEFAULT 0,

    continue_on_error INTEGER NOT NULL DEFAULT 1,

    enabled INTEGER NOT NULL DEFAULT 1,

    last_triggered_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    successful_deliveries INTEGER NOT NULL DEFAULT 0,

    failed_deliveries INTEGER NOT NULL DEFAULT 0,

    total_deliveries INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_by TEXT,

    updated_by TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES movie_ai_webhook_events(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_uuid
ON movie_ai_webhook_event_subscriptions(subscription_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_webhook
ON movie_ai_webhook_event_subscriptions(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_event
ON movie_ai_webhook_event_subscriptions(event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_name
ON movie_ai_webhook_event_subscriptions(subscription_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_priority
ON movie_ai_webhook_event_subscriptions(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_order
ON movie_ai_webhook_event_subscriptions(execution_order);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_delivery
ON movie_ai_webhook_event_subscriptions(delivery_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_enabled
ON movie_ai_webhook_event_subscriptions(enabled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_last_triggered
ON movie_ai_webhook_event_subscriptions(last_triggered_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_last_success
ON movie_ai_webhook_event_subscriptions(last_success_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_last_failure
ON movie_ai_webhook_event_subscriptions(last_failure_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_created
ON movie_ai_webhook_event_subscriptions(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_event_subscriptions_updated
ON movie_ai_webhook_event_subscriptions(updated_at);

COMMIT;