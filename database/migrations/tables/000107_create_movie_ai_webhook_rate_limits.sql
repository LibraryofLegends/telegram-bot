/*
================================================================
Library Of Legends 2.0
Migration: 000107_create_movie_ai_webhook_rate_limits.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Rate-Limit-Verwaltung
für das Webhook-System.

Diese Tabelle definiert Grenzwerte für
Webhooks, Events, Provider und IP-Adressen
inklusive Burst-Limits, Zeitfenstern,
Sperrzeiten, Quoten und Statistiken.

Unterstützte Funktionen:
- Rate Limits
- Burst Limits
- Quotas
- Sliding Window
- Fixed Window
- Token Bucket
- IP-Limits
- Provider-Limits
- Event-Limits
- Audit

Erstellt:
- movie_ai_webhook_rate_limits

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql
- 000100_create_movie_ai_webhook_events.sql
- 000058_create_movie_ai_providers.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_rate_limits
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    rate_limit_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER,

    event_id INTEGER,

    provider_id INTEGER,

    rate_limit_name TEXT NOT NULL,

    rate_limit_scope TEXT NOT NULL,

    algorithm TEXT NOT NULL DEFAULT 'token_bucket',

    window_type TEXT NOT NULL DEFAULT 'sliding',

    window_seconds INTEGER NOT NULL,

    requests_per_window INTEGER NOT NULL,

    burst_limit INTEGER,

    quota_per_day INTEGER,

    quota_per_month INTEGER,

    concurrent_requests INTEGER,

    cooldown_seconds INTEGER DEFAULT 0,

    block_duration_seconds INTEGER DEFAULT 0,

    whitelist_ips TEXT,

    blacklist_ips TEXT,

    current_requests INTEGER NOT NULL DEFAULT 0,

    current_quota_day INTEGER NOT NULL DEFAULT 0,

    current_quota_month INTEGER NOT NULL DEFAULT 0,

    violations INTEGER NOT NULL DEFAULT 0,

    blocked_requests INTEGER NOT NULL DEFAULT 0,

    last_violation_at DATETIME,

    last_reset_at DATETIME,

    next_reset_at DATETIME,

    enabled INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES movie_ai_webhook_events(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_uuid
ON movie_ai_webhook_rate_limits(rate_limit_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_webhook
ON movie_ai_webhook_rate_limits(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_event
ON movie_ai_webhook_rate_limits(event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_provider
ON movie_ai_webhook_rate_limits(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_name
ON movie_ai_webhook_rate_limits(rate_limit_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_scope
ON movie_ai_webhook_rate_limits(rate_limit_scope);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_algorithm
ON movie_ai_webhook_rate_limits(algorithm);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_window
ON movie_ai_webhook_rate_limits(window_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_enabled
ON movie_ai_webhook_rate_limits(enabled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_last_violation
ON movie_ai_webhook_rate_limits(last_violation_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_next_reset
ON movie_ai_webhook_rate_limits(next_reset_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_created
ON movie_ai_webhook_rate_limits(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_rate_limits_updated
ON movie_ai_webhook_rate_limits(updated_at);

COMMIT;