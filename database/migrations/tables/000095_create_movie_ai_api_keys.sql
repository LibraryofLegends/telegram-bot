/*
================================================================
Library Of Legends 2.0
Migration: 000095_create_movie_ai_api_keys.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale API-Key-Management
für Library Of Legends.

Diese Tabelle verwaltet sämtliche internen
und externen API-Schlüssel inklusive
Verschlüsselung, Fingerprints, Rotation,
Scopes, Ablaufzeiten, Sicherheitsrichtlinien
und Audit-Metadaten.

Unterstützte Funktionen:
- API-Key-Verwaltung
- Verschlüsselte Speicherung
- Fingerprints
- Rotation
- Ablaufverwaltung
- IP-Whitelist
- Nutzungsbeschränkungen
- Rate Limits
- Audit-Unterstützung
- Sicherheitsstatus

Erstellt:
- movie_ai_api_keys

Abhängigkeiten:
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000087_create_movie_ai_roles.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_api_keys
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    api_key_uuid TEXT NOT NULL UNIQUE,

    provider_id INTEGER,

    role_id INTEGER,

    agent_id INTEGER,

    key_name TEXT NOT NULL,

    key_type TEXT NOT NULL,

    provider_name TEXT NOT NULL,

    encrypted_key TEXT NOT NULL,

    encryption_algorithm TEXT NOT NULL,

    key_fingerprint TEXT NOT NULL UNIQUE,

    key_prefix TEXT,

    key_version TEXT,

    scope TEXT,

    permissions TEXT,

    environment TEXT NOT NULL DEFAULT 'production',

    ip_whitelist TEXT,

    allowed_origins TEXT,

    allowed_hosts TEXT,

    usage_limit_daily INTEGER,

    usage_limit_monthly INTEGER,

    rate_limit_per_minute INTEGER,

    issued_by TEXT,

    rotation_interval_days INTEGER,

    rotation_count INTEGER NOT NULL DEFAULT 0,

    last_rotated_at DATETIME,

    last_used_at DATETIME,

    expires_at DATETIME,

    revoked_at DATETIME,

    revoked_by TEXT,

    revoke_reason TEXT,

    failed_usage_count INTEGER NOT NULL DEFAULT 0,

    successful_usage_count INTEGER NOT NULL DEFAULT 0,

    security_level TEXT NOT NULL DEFAULT 'standard',

    is_active INTEGER NOT NULL DEFAULT 1,

    is_revoked INTEGER NOT NULL DEFAULT 0,

    is_expired INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_uuid
ON movie_ai_api_keys(api_key_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_provider
ON movie_ai_api_keys(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_role
ON movie_ai_api_keys(role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_agent
ON movie_ai_api_keys(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_name
ON movie_ai_api_keys(key_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_type
ON movie_ai_api_keys(key_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_provider_name
ON movie_ai_api_keys(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_fingerprint
ON movie_ai_api_keys(key_fingerprint);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_environment
ON movie_ai_api_keys(environment);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_last_used
ON movie_ai_api_keys(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_last_rotated
ON movie_ai_api_keys(last_rotated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_expires
ON movie_ai_api_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_revoked
ON movie_ai_api_keys(revoked_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_security
ON movie_ai_api_keys(security_level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_active
ON movie_ai_api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_revoked_flag
ON movie_ai_api_keys(is_revoked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_expired_flag
ON movie_ai_api_keys(is_expired);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_keys_created
ON movie_ai_api_keys(created_at);

COMMIT;