/*
================================================================
Library Of Legends 2.0
Migration: 000059_create_movie_ai_provider_keys.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung sämtlicher
API-Schlüssel und Zugangsdaten für KI-Anbieter.

Diese Tabelle ermöglicht die sichere Verwaltung
mehrerer API-Schlüssel pro Anbieter inklusive
Rotation, Failover, Nutzungsstatistiken und
Gültigkeitszeiträumen.

Unterstützte Funktionen:
- Mehrere API-Keys
- Organisationen
- Projekte
- Verschlüsselte Speicherung
- Schlüsselrotation
- Priorisierung
- Failover
- Nutzungsstatistiken
- Ablaufverwaltung
- Aktivierungsstatus

Erstellt:
- movie_ai_provider_keys

Abhängigkeiten:
- 000058_create_movie_ai_providers.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_provider_keys
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    provider_id INTEGER NOT NULL,

    key_name TEXT NOT NULL,

    key_identifier TEXT NOT NULL UNIQUE,

    api_key TEXT NOT NULL,

    api_key_hash TEXT,

    encryption_method TEXT,

    organization_id TEXT,

    project_id TEXT,

    account_name TEXT,

    account_email TEXT,

    endpoint_override TEXT,

    region TEXT,

    priority INTEGER NOT NULL DEFAULT 100,

    weight INTEGER NOT NULL DEFAULT 100,

    requests_today INTEGER NOT NULL DEFAULT 0,

    requests_this_month INTEGER NOT NULL DEFAULT 0,

    tokens_today INTEGER NOT NULL DEFAULT 0,

    tokens_this_month INTEGER NOT NULL DEFAULT 0,

    estimated_cost_today REAL NOT NULL DEFAULT 0,

    estimated_cost_this_month REAL NOT NULL DEFAULT 0,

    rate_limit_remaining INTEGER,

    daily_request_limit INTEGER,

    monthly_request_limit INTEGER,

    monthly_budget REAL,

    last_used_at DATETIME,

    last_rotated_at DATETIME,

    expires_at DATETIME,

    failover_enabled INTEGER NOT NULL DEFAULT 1,

    rotation_enabled INTEGER NOT NULL DEFAULT 1,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    notes TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_provider
ON movie_ai_provider_keys(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_identifier
ON movie_ai_provider_keys(key_identifier);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_priority
ON movie_ai_provider_keys(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_weight
ON movie_ai_provider_keys(weight);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_primary
ON movie_ai_provider_keys(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_active
ON movie_ai_provider_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_failover
ON movie_ai_provider_keys(failover_enabled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_rotation
ON movie_ai_provider_keys(rotation_enabled);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_last_used
ON movie_ai_provider_keys(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_expires
ON movie_ai_provider_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_provider_keys_created
ON movie_ai_provider_keys(created_at);

COMMIT;