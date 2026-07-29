/*
================================================================
Library Of Legends 2.0
Migration: 000092_create_movie_ai_refresh_tokens.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Refresh-Token-System
für Library Of Legends.

Diese Tabelle verwaltet langlebige
Refresh-Tokens zur sicheren Erneuerung von
Access-Tokens.

Unterstützte Funktionen:
- Refresh-Tokens
- Token-Familien
- Rotation
- Reuse Detection
- Gerätebindung
- Sitzungsbindung
- Ablaufzeiten
- Widerruf kompletter Token-Ketten
- Audit-Unterstützung

Erstellt:
- movie_ai_refresh_tokens

Abhängigkeiten:
- 000091_create_movie_ai_access_tokens.sql
- 000062_create_movie_ai_agents.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_refresh_tokens
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    refresh_token_uuid TEXT NOT NULL UNIQUE,

    access_token_id INTEGER,

    agent_id INTEGER,

    identity_type TEXT NOT NULL,

    identity_id TEXT NOT NULL,

    token_family_uuid TEXT NOT NULL,

    parent_refresh_token_uuid TEXT,

    replacement_refresh_token_uuid TEXT,

    token_hash TEXT NOT NULL UNIQUE,

    token_fingerprint TEXT NOT NULL,

    token_prefix TEXT,

    session_id TEXT,

    device_id TEXT,

    device_name TEXT,

    device_platform TEXT,

    user_agent TEXT,

    ip_address TEXT,

    country_code TEXT,

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME NOT NULL,

    last_used_at DATETIME,

    rotated_at DATETIME,

    revoked_at DATETIME,

    revoked_by TEXT,

    revoke_reason TEXT,

    reuse_detected_at DATETIME,

    reuse_detection_count INTEGER NOT NULL DEFAULT 0,

    rotation_count INTEGER NOT NULL DEFAULT 0,

    login_count INTEGER NOT NULL DEFAULT 0,

    failed_usage_count INTEGER NOT NULL DEFAULT 0,

    family_revoked INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    is_revoked INTEGER NOT NULL DEFAULT 0,

    is_expired INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (access_token_id)
        REFERENCES movie_ai_access_tokens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_uuid
ON movie_ai_refresh_tokens(refresh_token_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_access
ON movie_ai_refresh_tokens(access_token_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_agent
ON movie_ai_refresh_tokens(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_identity_type
ON movie_ai_refresh_tokens(identity_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_identity_id
ON movie_ai_refresh_tokens(identity_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_family
ON movie_ai_refresh_tokens(token_family_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_parent
ON movie_ai_refresh_tokens(parent_refresh_token_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_hash
ON movie_ai_refresh_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_fingerprint
ON movie_ai_refresh_tokens(token_fingerprint);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_session
ON movie_ai_refresh_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_device
ON movie_ai_refresh_tokens(device_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_ip
ON movie_ai_refresh_tokens(ip_address);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_last_used
ON movie_ai_refresh_tokens(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_expires
ON movie_ai_refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_rotated
ON movie_ai_refresh_tokens(rotated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_revoked
ON movie_ai_refresh_tokens(revoked_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_reuse
ON movie_ai_refresh_tokens(reuse_detected_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_active
ON movie_ai_refresh_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_revoked_flag
ON movie_ai_refresh_tokens(is_revoked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_expired_flag
ON movie_ai_refresh_tokens(is_expired);

CREATE INDEX IF NOT EXISTS idx_movie_ai_refresh_tokens_created
ON movie_ai_refresh_tokens(created_at);

COMMIT;