/*
================================================================
Library Of Legends 2.0
Migration: 000102_create_movie_ai_webhook_delivery_attempts.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historie sämtlicher
Webhook-Zustellversuche.

Jeder Retry einer Webhook-Auslieferung wird
als eigener Datensatz gespeichert und
enthält sämtliche technischen,
sicherheitsrelevanten und diagnostischen
Informationen.

Unterstützte Funktionen:
- Retry-Historie
- Zustellversuche
- HTTP-Protokollierung
- Antwortzeiten
- Fehleranalyse
- Signaturprüfung
- Rate-Limits
- Audit
- Debugging
- Monitoring

Erstellt:
- movie_ai_webhook_delivery_attempts

Abhängigkeiten:
- 000099_create_movie_ai_webhook_deliveries.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_delivery_attempts
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    attempt_uuid TEXT NOT NULL UNIQUE,

    delivery_id INTEGER NOT NULL,

    attempt_number INTEGER NOT NULL,

    retry_reason TEXT,

    request_method TEXT NOT NULL,

    request_url TEXT NOT NULL,

    request_headers TEXT,

    request_body TEXT,

    response_headers TEXT,

    response_body TEXT,

    http_status INTEGER,

    success INTEGER NOT NULL DEFAULT 0,

    latency_ms INTEGER,

    dns_lookup_ms INTEGER,

    tcp_connect_ms INTEGER,

    tls_handshake_ms INTEGER,

    request_size_bytes INTEGER,

    response_size_bytes INTEGER,

    signature_algorithm TEXT,

    signature_valid INTEGER NOT NULL DEFAULT 1,

    authentication_result TEXT,

    rate_limit_limit INTEGER,

    rate_limit_remaining INTEGER,

    rate_limit_reset_at DATETIME,

    remote_ip TEXT,

    user_agent TEXT,

    request_id TEXT,

    correlation_id TEXT,

    error_code TEXT,

    error_message TEXT,

    exception_type TEXT,

    stack_trace TEXT,

    metadata TEXT,

    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_id)
        REFERENCES movie_ai_webhook_deliveries(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_uuid
ON movie_ai_webhook_delivery_attempts(attempt_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_delivery
ON movie_ai_webhook_delivery_attempts(delivery_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_number
ON movie_ai_webhook_delivery_attempts(attempt_number);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_status
ON movie_ai_webhook_delivery_attempts(http_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_success
ON movie_ai_webhook_delivery_attempts(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_latency
ON movie_ai_webhook_delivery_attempts(latency_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_request
ON movie_ai_webhook_delivery_attempts(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_correlation
ON movie_ai_webhook_delivery_attempts(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_signature
ON movie_ai_webhook_delivery_attempts(signature_valid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_started
ON movie_ai_webhook_delivery_attempts(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_completed
ON movie_ai_webhook_delivery_attempts(completed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_delivery_attempts_created
ON movie_ai_webhook_delivery_attempts(created_at);

COMMIT;