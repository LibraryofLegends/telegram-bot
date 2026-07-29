/*
================================================================
Library Of Legends 2.0
Migration: 000093_create_movie_ai_sessions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Session-Management
für Library Of Legends.

Diese Tabelle verwaltet sämtliche aktiven
und historischen Sitzungen von Benutzern,
Agenten, Workern und Service Accounts.

Unterstützte Funktionen:
- Benutzer-Sessions
- Agent-Sessions
- Worker-Sessions
- Service-Sessions
- Geräteinformationen
- IP-Tracking
- MFA-Status
- Heartbeats
- Session-Timeouts
- Sperrungen
- Beendigungen
- Sicherheitsmetadaten

Erstellt:
- movie_ai_sessions

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000091_create_movie_ai_access_tokens.sql
- 000092_create_movie_ai_refresh_tokens.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_sessions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    session_uuid TEXT NOT NULL UNIQUE,

    identity_type TEXT NOT NULL,

    identity_id TEXT NOT NULL,

    access_token_id INTEGER,

    refresh_token_id INTEGER,

    agent_id INTEGER,

    session_type TEXT NOT NULL,

    session_name TEXT,

    authentication_method TEXT,

    authentication_level TEXT DEFAULT 'standard',

    mfa_enabled INTEGER NOT NULL DEFAULT 0,

    mfa_verified INTEGER NOT NULL DEFAULT 0,

    device_id TEXT,

    device_name TEXT,

    device_platform TEXT,

    device_model TEXT,

    operating_system TEXT,

    application_name TEXT,

    application_version TEXT,

    browser_name TEXT,

    browser_version TEXT,

    user_agent TEXT,

    ip_address TEXT,

    country_code TEXT,

    region TEXT,

    city TEXT,

    timezone TEXT,

    login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_activity_at DATETIME,

    last_heartbeat_at DATETIME,

    expires_at DATETIME,

    idle_timeout_seconds INTEGER DEFAULT 1800,

    absolute_timeout_seconds INTEGER DEFAULT 86400,

    logout_at DATETIME,

    terminated_at DATETIME,

    terminated_by TEXT,

    termination_reason TEXT,

    failed_authentication_count INTEGER NOT NULL DEFAULT 0,

    security_score INTEGER DEFAULT 100,

    is_active INTEGER NOT NULL DEFAULT 1,

    is_locked INTEGER NOT NULL DEFAULT 0,

    is_expired INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (access_token_id)
        REFERENCES movie_ai_access_tokens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (refresh_token_id)
        REFERENCES movie_ai_refresh_tokens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_uuid
ON movie_ai_sessions(session_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_identity_type
ON movie_ai_sessions(identity_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_identity_id
ON movie_ai_sessions(identity_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_access_token
ON movie_ai_sessions(access_token_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_refresh_token
ON movie_ai_sessions(refresh_token_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_agent
ON movie_ai_sessions(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_type
ON movie_ai_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_device
ON movie_ai_sessions(device_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_ip
ON movie_ai_sessions(ip_address);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_login
ON movie_ai_sessions(login_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_activity
ON movie_ai_sessions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_heartbeat
ON movie_ai_sessions(last_heartbeat_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_expires
ON movie_ai_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_logout
ON movie_ai_sessions(logout_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_terminated
ON movie_ai_sessions(terminated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_active
ON movie_ai_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_locked
ON movie_ai_sessions(is_locked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_expired
ON movie_ai_sessions(is_expired);

CREATE INDEX IF NOT EXISTS idx_movie_ai_sessions_created
ON movie_ai_sessions(created_at);

COMMIT;