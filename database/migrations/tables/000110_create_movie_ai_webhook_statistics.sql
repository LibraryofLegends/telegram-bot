/*
================================================================
Library Of Legends 2.0
Migration: 000110_create_movie_ai_webhook_statistics.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Statistik- und
Monitoring-Tabelle für das gesamte
Webhook-System.

Diese Tabelle speichert aggregierte
Kennzahlen zu Webhook-Auslieferungen,
Performance, Fehlern, Sicherheits-
ereignissen, Datenvolumen sowie
zeitbasierten Auswertungen.

Unterstützte Funktionen:
- Erfolgsquoten
- Fehlerraten
- Antwortzeiten
- Retry-Statistiken
- Datenvolumen
- Sicherheitsmetriken
- Event-Auswertungen
- Provider-Auswertungen
- Performance-Monitoring
- Dashboard-Grundlage

Erstellt:
- movie_ai_webhook_statistics

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

CREATE TABLE IF NOT EXISTS movie_ai_webhook_statistics
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    statistic_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER,

    event_id INTEGER,

    provider_id INTEGER,

    statistic_period TEXT NOT NULL,

    period_start DATETIME NOT NULL,

    period_end DATETIME NOT NULL,

    total_requests INTEGER NOT NULL DEFAULT 0,

    successful_requests INTEGER NOT NULL DEFAULT 0,

    failed_requests INTEGER NOT NULL DEFAULT 0,

    timeout_requests INTEGER NOT NULL DEFAULT 0,

    retried_requests INTEGER NOT NULL DEFAULT 0,

    blocked_requests INTEGER NOT NULL DEFAULT 0,

    security_events INTEGER NOT NULL DEFAULT 0,

    replay_attacks INTEGER NOT NULL DEFAULT 0,

    signature_failures INTEGER NOT NULL DEFAULT 0,

    authentication_failures INTEGER NOT NULL DEFAULT 0,

    rate_limit_violations INTEGER NOT NULL DEFAULT 0,

    average_latency_ms REAL,

    minimum_latency_ms INTEGER,

    maximum_latency_ms INTEGER,

    median_latency_ms REAL,

    p95_latency_ms REAL,

    p99_latency_ms REAL,

    average_request_size_bytes INTEGER,

    average_response_size_bytes INTEGER,

    total_request_bytes INTEGER,

    total_response_bytes INTEGER,

    total_retry_attempts INTEGER NOT NULL DEFAULT 0,

    total_processing_time_ms INTEGER,

    success_rate REAL,

    failure_rate REAL,

    availability_percentage REAL,

    throughput_per_minute REAL,

    throughput_per_hour REAL,

    throughput_per_day REAL,

    most_common_http_status INTEGER,

    most_common_error_code TEXT,

    metadata TEXT,

    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES movie_ai_webhook_events(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_uuid
ON movie_ai_webhook_statistics(statistic_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_webhook
ON movie_ai_webhook_statistics(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_event
ON movie_ai_webhook_statistics(event_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_provider
ON movie_ai_webhook_statistics(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_period
ON movie_ai_webhook_statistics(statistic_period);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_period_start
ON movie_ai_webhook_statistics(period_start);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_period_end
ON movie_ai_webhook_statistics(period_end);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_success_rate
ON movie_ai_webhook_statistics(success_rate);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_failure_rate
ON movie_ai_webhook_statistics(failure_rate);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_availability
ON movie_ai_webhook_statistics(availability_percentage);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_latency
ON movie_ai_webhook_statistics(average_latency_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_generated
ON movie_ai_webhook_statistics(generated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_created
ON movie_ai_webhook_statistics(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_statistics_updated
ON movie_ai_webhook_statistics(updated_at);

COMMIT;