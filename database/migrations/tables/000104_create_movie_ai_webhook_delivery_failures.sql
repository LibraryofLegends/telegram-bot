/*
================================================================
Library Of Legends 2.0
Migration: 000104_create_movie_ai_webhook_delivery_failures.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Fehlerregister
für fehlgeschlagene Webhook-Zustellungen.

Diese Tabelle speichert dauerhaft
fehlgeschlagene Auslieferungen inklusive
Retry-Verlauf, Dead-Letter-Informationen,
Recovery-Status, Diagnose- und
Auditdaten.

Unterstützte Funktionen:
- Delivery Failures
- Dead Letter Queue
- Fehlerhistorie
- Retry-Auswertung
- Recovery
- Diagnose
- Monitoring
- Audit
- Debugging
- Sicherheitsanalyse

Erstellt:
- movie_ai_webhook_delivery_failures

Abhängigkeiten:
- 000099_create_movie_ai_webhook_deliveries.sql
- 000102_create_movie_ai_webhook_delivery_attempts.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_delivery_failures
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    failure_uuid TEXT NOT NULL UNIQUE,

    delivery_id INTEGER NOT NULL,

    last_attempt_id INTEGER,

    webhook_id INTEGER NOT NULL,

    failure_type TEXT NOT NULL,

    severity TEXT NOT NULL DEFAULT 'error',

    error_code TEXT,

    error_category TEXT,

    exception_type TEXT,

    exception_message TEXT,

    stack_trace TEXT,

    http_status INTEGER,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retry_count INTEGER NOT NULL DEFAULT 0,

    retry_exhausted INTEGER NOT NULL DEFAULT 0,

    moved_to_dead_letter INTEGER NOT NULL DEFAULT 0,

    dead_letter_reason TEXT,

    recovery_status TEXT NOT NULL DEFAULT 'pending',

    recovery_attempts INTEGER NOT NULL DEFAULT 0,

    recovered INTEGER NOT NULL DEFAULT 0,

    recovered_at DATETIME,

    recovered_by TEXT,

    root_cause TEXT,

    diagnostic_data TEXT,

    request_snapshot TEXT,

    response_snapshot TEXT,

    correlation_id TEXT,

    request_id TEXT,

    metadata TEXT,

    failed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_id)
        REFERENCES movie_ai_webhook_deliveries(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (last_attempt_id)
        REFERENCES movie_ai_webhook_delivery_attempts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_uuid
ON movie_ai_webhook_delivery_failures(failure_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_delivery
ON movie_ai_webhook_delivery_failures(delivery_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_attempt
ON movie_ai_webhook_delivery_failures(last_attempt_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_webhook
ON movie_ai_webhook_delivery_failures(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_type
ON movie_ai_webhook_delivery_failures(failure_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_severity
ON movie_ai_webhook_delivery_failures(severity);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_status
ON movie_ai_webhook_delivery_failures(recovery_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_dead_letter
ON movie_ai_webhook_delivery_failures(moved_to_dead_letter);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_recovered
ON movie_ai_webhook_delivery_failures(recovered);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_http
ON movie_ai_webhook_delivery_failures(http_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_failed_at
ON movie_ai_webhook_delivery_failures(failed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_correlation
ON movie_ai_webhook_delivery_failures(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_request
ON movie_ai_webhook_delivery_failures(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_created
ON movie_ai_webhook_delivery_failures(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_failures_updated
ON movie_ai_webhook_delivery_failures(updated_at);

COMMIT;