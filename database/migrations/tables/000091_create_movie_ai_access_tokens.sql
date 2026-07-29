/*
================================================================
Library Of Legends 2.0
Migration: 000091_create_movie_ai_access_tokens.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Access-Token-System
für Library Of Legends.

Diese Tabelle verwaltet sämtliche
Authentifizierungs-Tokens für Benutzer,
Agenten, Worker, APIs und Service Accounts.

Unterstützte Funktionen:
- API-Tokens
- Session-Tokens
- Agent-Tokens
- Worker-Tokens
- Service-Account-Tokens
- Token-Rotation
- Revocation
- Fingerprints
- Ablaufzeiten
- Scopes
- Gerätebindung
- IP-Bindung
- Audit-Unterstützung

Erstellt:
- movie_ai_access_tokens

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000087_create_movie_ai_roles.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_access_tokens
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    token_uuid TEXT NOT NULL UNIQUE,

    identity_type TEXT NOT NULL,

    identity_id TEXT NOT NULL,

    role_id INTEGER,

    agent_id INTEGER,

    token_type TEXT NOT NULL,

    token_name TEXT,

    token_hash TEXT NOT NULL UNIQUE,

    token_fingerprint TEXT NOT NULL,

    token_prefix TEXT,

    scope TEXT,

    permissions TEXT,

    issued_by TEXT,

    issued_reason TEXT,

    session_id TEXT,

    device_id TEXT,

    device_name TEXT,

    device_platform TEXT,

    user_agent TEXT,

    ip_address TEXT,

    country_code TEXT,

    last_used_at DATETIME,

    last_used_ip TEXT,

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME,

    revoked_at DATETIME,

    revoked_by TEXT,

    revoke_reason TEXT,

    rotation_count INTEGER NOT NULL DEFAULT 0,

    previous_token_uuid TEXT,

    replacement_token_uuid TEXT,

    login_count INTEGER NOT NULL DEFAULT 0,

    failed_usage_count INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    is_revoked INTEGER NOT NULL DEFAULT 0,

    is_expired INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_uuid
ON movie_ai_access_tokens(token_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_identity_type
ON movie_ai_access_tokens(identity_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_identity_id
ON movie_ai_access_tokens(identity_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_role
ON movie_ai_access_tokens(role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_agent
ON movie_ai_access_tokens(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_type
ON movie_ai_access_tokens(token_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_hash
ON movie_ai_access_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_fingerprint
ON movie_ai_access_tokens(token_fingerprint);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_session
ON movie_ai_access_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_device
ON movie_ai_access_tokens(device_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_ip
ON movie_ai_access_tokens(ip_address);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_last_used
ON movie_ai_access_tokens(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_expires
ON movie_ai_access_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_revoked
ON movie_ai_access_tokens(revoked_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_active
ON movie_ai_access_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_revoked_flag
ON movie_ai_access_tokens(is_revoked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_expired_flag
ON movie_ai_access_tokens(is_expired);

CREATE INDEX IF NOT EXISTS idx_movie_ai_access_tokens_created
ON movie_ai_access_tokens(created_at);

COMMIT;