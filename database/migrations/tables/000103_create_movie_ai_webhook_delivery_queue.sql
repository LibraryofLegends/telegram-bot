/*
================================================================
Library Of Legends 2.0
Migration: 000103_create_movie_ai_webhook_delivery_queue.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Webhook-
Zustellwarteschlange.

Diese Tabelle verwaltet sämtliche
ausstehenden Webhook-Auslieferungen
inklusive Priorisierung, Scheduling,
Retry-Strategien, Worker-Zuweisungen,
Sperren und Statusinformationen.

Unterstützte Funktionen:
- Delivery Queue
- Prioritäten
- Scheduling
- Delayed Jobs
- Retry Queue
- Worker-Zuweisung
- Locking
- Statusverwaltung
- Monitoring
- Audit

Erstellt:
- movie_ai_webhook_delivery_queue

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql
- 000100_create_movie_ai_webhook_events.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_delivery_queue
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    queue_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER NOT NULL,

    event_id INTEGER,

    queue_name TEXT NOT NULL,

    queue_type TEXT NOT NULL DEFAULT 'default',

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'pending',

    payload TEXT,

    payload_checksum TEXT,

    scheduled_at DATETIME,

    available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    started_at DATETIME,

    completed_at DATETIME,

    failed_at DATETIME,

    expires_at DATETIME,

    worker_id TEXT,

    worker_name TEXT,

    worker_hostname TEXT,

    lock_token TEXT,

    locked_at DATETIME,

    lock_expires_at DATETIME,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retry_count INTEGER NOT NULL DEFAULT 5,

    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,

    next_retry_at DATETIME,

    timeout_seconds INTEGER NOT NULL DEFAULT 30,

    processing_time_ms INTEGER,

    last_error_code TEXT,

    last_error_message TEXT,

    last_http_status INTEGER,

    correlation_id TEXT,

    request_id TEXT,

    source_system TEXT,

    destination_system TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES movie_ai_webhook_events(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_uuid
ON movie_ai_webhook_delivery_queue(queue_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_webhook
ON movie_ai_webhook_delivery_queue(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_event
ON movie_ai_webhook_delivery_queue(event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_name
ON movie_ai_webhook_delivery_queue(queue_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_status
ON movie_ai_webhook_delivery_queue(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_priority
ON movie_ai_webhook_delivery_queue(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_available
ON movie_ai_webhook_delivery_queue(available_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_scheduled
ON movie_ai_webhook_delivery_queue(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_retry
ON movie_ai_webhook_delivery_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_worker
ON movie_ai_webhook_delivery_queue(worker_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_lock
ON movie_ai_webhook_delivery_queue(lock_token);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_correlation
ON movie_ai_webhook_delivery_queue(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_request
ON movie_ai_webhook_delivery_queue(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_created
ON movie_ai_webhook_delivery_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_queue_updated
ON movie_ai_webhook_delivery_queue(updated_at);

COMMIT;