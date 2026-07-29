/*
================================================================
Library Of Legends 2.0
Migration: 000098_create_movie_ai_webhooks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Webhook-Management
für Library Of Legends.

Diese Tabelle verwaltet eingehende und
ausgehende Webhooks inklusive Endpunkten,
Authentifizierung, Signaturen, Secret-Keys,
Retry-Strategien, Ereignisfiltern,
Rate-Limits und Sicherheitsrichtlinien.

Unterstützte Funktionen:
- Incoming Webhooks
- Outgoing Webhooks
- HTTP-Methoden
- Authentifizierung
- Signaturen
- Secret Keys
- Retry-Strategien
- Timeouts
- Ereignisfilter
- Rate Limits
- Sicherheitsrichtlinien

Erstellt:
- movie_ai_webhooks

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

CREATE TABLE IF NOT EXISTS movie_ai_webhooks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    webhook_uuid TEXT NOT NULL UNIQUE,

    provider_id INTEGER,

    workflow_id INTEGER,

    agent_id INTEGER,

    webhook_name TEXT NOT NULL,

    webhook_type TEXT NOT NULL,

    direction TEXT NOT NULL,

    endpoint_url TEXT NOT NULL,

    http_method TEXT NOT NULL DEFAULT 'POST',

    authentication_type TEXT NOT NULL DEFAULT 'none',

    authentication_configuration TEXT,

    secret_key TEXT,

    signature_algorithm TEXT,

    signature_header TEXT,

    custom_headers TEXT,

    event_filter TEXT,

    content_type TEXT NOT NULL DEFAULT 'application/json',

    timeout_seconds INTEGER NOT NULL DEFAULT 30,

    retry_enabled INTEGER NOT NULL DEFAULT 1,

    max_retry_count INTEGER NOT NULL DEFAULT 5,

    retry_interval_seconds INTEGER NOT NULL DEFAULT 60,

    rate_limit_per_minute INTEGER,

    allowed_ips TEXT,

    allowed_origins TEXT,

    verify_ssl INTEGER NOT NULL DEFAULT 1,

    validate_signature INTEGER NOT NULL DEFAULT 1,

    last_triggered_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    total_requests INTEGER NOT NULL DEFAULT 0,

    successful_requests INTEGER NOT NULL DEFAULT 0,

    failed_requests INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'active',

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

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_uuid
ON movie_ai_webhooks(webhook_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_provider
ON movie_ai_webhooks(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_workflow
ON movie_ai_webhooks(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_agent
ON movie_ai_webhooks(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_name
ON movie_ai_webhooks(webhook_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_type
ON movie_ai_webhooks(webhook_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_direction
ON movie_ai_webhooks(direction);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_method
ON movie_ai_webhooks(http_method);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_auth
ON movie_ai_webhooks(authentication_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_status
ON movie_ai_webhooks(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_last_triggered
ON movie_ai_webhooks(last_triggered_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_last_success
ON movie_ai_webhooks(last_success_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_last_failure
ON movie_ai_webhooks(last_failure_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhooks_created
ON movie_ai_webhooks(created_at);

COMMIT;