/*
================================================================
Library Of Legends 2.0
Migration: 000099_create_movie_ai_webhook_deliveries.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die revisionssichere Historie
sämtlicher Webhook-Auslieferungen.

Diese Tabelle protokolliert eingehende und
ausgehende Webhook-Aufrufe inklusive
Requests, Responses, Retry-Versuchen,
Signaturprüfungen, Antwortzeiten,
Fehlern und Sicherheitsinformationen.

Unterstützte Funktionen:
- Incoming Webhooks
- Outgoing Webhooks
- Request/Response Logging
- Retry-Historie
- HTTP Status
- Latenzmessung
- Signaturprüfung
- Rate-Limit Informationen
- Audit
- Debugging

Erstellt:
- movie_ai_webhook_deliveries

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_deliveries
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    delivery_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER NOT NULL,

    webhook_uuid TEXT NOT NULL,

    direction TEXT NOT NULL,

    event_name TEXT,

    request_method TEXT NOT NULL,

    request_url TEXT NOT NULL,

    request_headers TEXT,

    request_body TEXT,

    response_headers TEXT,

    response_body TEXT,

    http_status INTEGER,

    latency_ms INTEGER,

    dns_lookup_ms INTEGER,

    tcp_connect_ms INTEGER,

    tls_handshake_ms INTEGER,

    request_size_bytes INTEGER,

    response_size_bytes INTEGER,

    retry_attempt INTEGER NOT NULL DEFAULT 0,

    max_retry_attempts INTEGER NOT NULL DEFAULT 0,

    retry_reason TEXT,

    signature_algorithm TEXT,

    signature_header TEXT,

    signature_valid INTEGER NOT NULL DEFAULT 1,

    authentication_result TEXT,

    rate_limit_limit INTEGER,

    rate_limit_remaining INTEGER,

    rate_limit_reset_at DATETIME,

    remote_ip TEXT,

    user_agent TEXT,

    correlation_id TEXT,

    request_id TEXT,

    success INTEGER NOT NULL DEFAULT 1,

    error_code TEXT,

    error_message TEXT,

    metadata TEXT,

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    responded_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_uuid
ON movie_ai_webhook_deliveries(delivery_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_webhook
ON movie_ai_webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_webhook_uuid
ON movie_ai_webhook_deliveries(webhook_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_direction
ON movie_ai_webhook_deliveries(direction);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_event
ON movie_ai_webhook_deliveries(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_method
ON movie_ai_webhook_deliveries(request_method);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_status
ON movie_ai_webhook_deliveries(http_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_success
ON movie_ai_webhook_deliveries(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_retry
ON movie_ai_webhook_deliveries(retry_attempt);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_signature
ON movie_ai_webhook_deliveries(signature_valid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_latency
ON movie_ai_webhook_deliveries(latency_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_correlation
ON movie_ai_webhook_deliveries(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_request
ON movie_ai_webhook_deliveries(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_requested
ON movie_ai_webhook_deliveries(requested_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_responded
ON movie_ai_webhook_deliveries(responded_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_deliveries_created
ON movie_ai_webhook_deliveries(created_at);

COMMIT;