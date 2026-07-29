/*
================================================================
Library Of Legends 2.0
Migration: 000094_create_movie_ai_session_events.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Session-Ereignishistorie
für Library Of Legends.

Diese Tabelle protokolliert sämtliche
Ereignisse innerhalb einer Sitzung und
bildet eine vollständige Chronologie
aller Session-Aktivitäten.

Unterstützte Funktionen:
- Login
- Logout
- Heartbeats
- Token-Rotation
- Token-Refresh
- MFA
- Gerätewechsel
- IP-Änderungen
- Timeouts
- Sperrungen
- Sicherheitsereignisse
- Audit-Unterstützung

Erstellt:
- movie_ai_session_events

Abhängigkeiten:
- 000093_create_movie_ai_sessions.sql
- 000091_create_movie_ai_access_tokens.sql
- 000092_create_movie_ai_refresh_tokens.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_session_events
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    event_uuid TEXT NOT NULL UNIQUE,

    session_id INTEGER NOT NULL,

    session_uuid TEXT NOT NULL,

    access_token_id INTEGER,

    refresh_token_id INTEGER,

    event_type TEXT NOT NULL,

    event_category TEXT NOT NULL,

    event_source TEXT,

    severity TEXT NOT NULL DEFAULT 'info',

    previous_state TEXT,

    current_state TEXT,

    authentication_method TEXT,

    authentication_result TEXT,

    mfa_method TEXT,

    ip_address TEXT,

    previous_ip_address TEXT,

    country_code TEXT,

    region TEXT,

    city TEXT,

    device_id TEXT,

    device_name TEXT,

    device_platform TEXT,

    browser_name TEXT,

    browser_version TEXT,

    user_agent TEXT,

    correlation_id TEXT,

    request_id TEXT,

    error_code TEXT,

    error_message TEXT,

    security_score INTEGER,

    metadata TEXT,

    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
        REFERENCES movie_ai_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (access_token_id)
        REFERENCES movie_ai_access_tokens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (refresh_token_id)
        REFERENCES movie_ai_refresh_tokens(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_uuid
ON movie_ai_session_events(event_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_session
ON movie_ai_session_events(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_session_uuid
ON movie_ai_session_events(session_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_access_token
ON movie_ai_session_events(access_token_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_refresh_token
ON movie_ai_session_events(refresh_token_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_type
ON movie_ai_session_events(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_category
ON movie_ai_session_events(event_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_source
ON movie_ai_session_events(event_source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_severity
ON movie_ai_session_events(severity);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_ip
ON movie_ai_session_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_device
ON movie_ai_session_events(device_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_browser
ON movie_ai_session_events(browser_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_correlation
ON movie_ai_session_events(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_request
ON movie_ai_session_events(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_occurred
ON movie_ai_session_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_session_events_created
ON movie_ai_session_events(created_at);

COMMIT;