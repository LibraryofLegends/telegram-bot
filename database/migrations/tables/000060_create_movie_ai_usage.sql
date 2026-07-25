/*
================================================================
Library Of Legends 2.0
Migration: 000060_create_movie_ai_usage.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Nutzungs- und Kostenstatistik
für sämtliche KI-Aufrufe innerhalb von
Library Of Legends.

Diese Tabelle dient zur vollständigen Erfassung
aller KI-Anfragen und bildet die Grundlage für:

- Kostenkontrolle
- Monitoring
- Dashboard-Auswertungen
- Budgetverwaltung
- Token-Statistiken
- Provider-Vergleiche
- Modellanalysen
- API-Auslastung

Erstellt:
- movie_ai_usage

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000059_create_movie_ai_provider_keys.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_usage
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    provider_id INTEGER NOT NULL,

    model_id INTEGER NOT NULL,

    provider_key_id INTEGER,

    request_uuid TEXT NOT NULL UNIQUE,

    workflow_name TEXT,

    operation_type TEXT NOT NULL,

    endpoint TEXT,

    user_id TEXT,

    session_id TEXT,

    correlation_id TEXT,

    request_timestamp DATETIME NOT NULL,

    response_timestamp DATETIME,

    execution_time_ms INTEGER,

    input_tokens INTEGER NOT NULL DEFAULT 0,

    output_tokens INTEGER NOT NULL DEFAULT 0,

    cached_tokens INTEGER NOT NULL DEFAULT 0,

    reasoning_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    input_cost REAL NOT NULL DEFAULT 0,

    output_cost REAL NOT NULL DEFAULT 0,

    total_cost REAL NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    http_status_code INTEGER,

    success INTEGER NOT NULL DEFAULT 1,

    error_code TEXT,

    error_message TEXT,

    retry_count INTEGER NOT NULL DEFAULT 0,

    rate_limit_remaining INTEGER,

    request_size_bytes INTEGER,

    response_size_bytes INTEGER,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (provider_key_id)
        REFERENCES movie_ai_provider_keys(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_provider
ON movie_ai_usage(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_model
ON movie_ai_usage(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_key
ON movie_ai_usage(provider_key_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_request
ON movie_ai_usage(request_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_workflow
ON movie_ai_usage(workflow_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_operation
ON movie_ai_usage(operation_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_user
ON movie_ai_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_session
ON movie_ai_usage(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_timestamp
ON movie_ai_usage(request_timestamp);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_success
ON movie_ai_usage(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_tokens
ON movie_ai_usage(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_cost
ON movie_ai_usage(total_cost);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_runtime
ON movie_ai_usage(execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_usage_correlation
ON movie_ai_usage(correlation_id);

COMMIT;