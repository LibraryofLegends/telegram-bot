/*
================================================================
Library Of Legends 2.0
Migration: 000096_create_movie_ai_api_key_usage.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Nutzungshistorie sämtlicher
API-Schlüssel innerhalb von
Library Of Legends.

Diese Tabelle protokolliert jeden API-
Aufruf inklusive Request-, Response-,
Performance-, Kosten-, Sicherheits- und
Auditinformationen.

Unterstützte Funktionen:
- API-Aufrufhistorie
- Request-/Response-Protokoll
- HTTP-Status
- Antwortzeiten
- Tokenverbrauch
- Kostenanalyse
- Rate-Limit Monitoring
- Fehleranalyse
- Sicherheitsüberwachung
- Audit-Unterstützung

Erstellt:
- movie_ai_api_key_usage

Abhängigkeiten:
- 000058_create_movie_ai_providers.sql
- 000057_create_movie_ai_models.sql
- 000095_create_movie_ai_api_keys.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_api_key_usage
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    usage_uuid TEXT NOT NULL UNIQUE,

    api_key_id INTEGER NOT NULL,

    provider_id INTEGER,

    model_id INTEGER,

    request_id TEXT,

    correlation_id TEXT,

    endpoint TEXT NOT NULL,

    http_method TEXT NOT NULL,

    request_size_bytes INTEGER,

    response_size_bytes INTEGER,

    request_tokens INTEGER,

    response_tokens INTEGER,

    total_tokens INTEGER,

    estimated_cost REAL,

    currency TEXT DEFAULT 'USD',

    http_status INTEGER,

    success INTEGER NOT NULL DEFAULT 1,

    latency_ms INTEGER,

    queue_time_ms INTEGER,

    retry_count INTEGER NOT NULL DEFAULT 0,

    rate_limit_remaining INTEGER,

    rate_limit_limit INTEGER,

    rate_limit_reset_at DATETIME,

    client_ip TEXT,

    user_agent TEXT,

    error_code TEXT,

    error_message TEXT,

    request_metadata TEXT,

    response_metadata TEXT,

    security_flags TEXT,

    metadata TEXT,

    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (api_key_id)
        REFERENCES movie_ai_api_keys(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_uuid
ON movie_ai_api_key_usage(usage_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_api_key
ON movie_ai_api_key_usage(api_key_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_provider
ON movie_ai_api_key_usage(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_model
ON movie_ai_api_key_usage(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_request
ON movie_ai_api_key_usage(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_correlation
ON movie_ai_api_key_usage(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_endpoint
ON movie_ai_api_key_usage(endpoint);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_method
ON movie_ai_api_key_usage(http_method);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_status
ON movie_ai_api_key_usage(http_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_success
ON movie_ai_api_key_usage(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_latency
ON movie_ai_api_key_usage(latency_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_tokens
ON movie_ai_api_key_usage(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_cost
ON movie_ai_api_key_usage(estimated_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_requested
ON movie_ai_api_key_usage(requested_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_completed
ON movie_ai_api_key_usage(completed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_usage_created
ON movie_ai_api_key_usage(created_at);

COMMIT;