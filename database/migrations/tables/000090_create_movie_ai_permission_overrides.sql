/*
================================================================
Library Of Legends 2.0
Migration: 000090_create_movie_ai_permission_overrides.sql
----------------------------------------------------------------
Beschreibung:
Erstellt individuelle Berechtigungs-
Überschreibungen (Permission Overrides)
für das RBAC-System.

Diese Tabelle ermöglicht das gezielte
Erlauben oder Verbieten einzelner
Berechtigungen für Benutzer, Agenten,
Service Accounts oder andere Identitäten,
ohne die zugrunde liegenden Rollen zu
verändern.

Unterstützte Funktionen:
- Allow / Deny Overrides
- Prioritäten
- Zeitliche Gültigkeit
- Delegationen
- Bedingungen
- Audit-Unterstützung
- Aktiv/Inaktiv

Erstellt:
- movie_ai_permission_overrides

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000086_create_movie_ai_permissions.sql
- 000089_create_movie_ai_user_roles.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_permission_overrides
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    override_uuid TEXT NOT NULL UNIQUE,

    identity_type TEXT NOT NULL,

    identity_id TEXT NOT NULL,

    permission_id INTEGER NOT NULL,

    agent_id INTEGER,

    override_type TEXT NOT NULL DEFAULT 'allow',

    priority INTEGER NOT NULL DEFAULT 100,

    condition_expression TEXT,

    restrictions TEXT,

    delegated_by TEXT,

    assigned_by TEXT,

    assignment_reason TEXT,

    assignment_source TEXT NOT NULL DEFAULT 'manual',

    valid_from DATETIME,

    valid_until DATETIME,

    is_active INTEGER NOT NULL DEFAULT 1,

    is_temporary INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (permission_id)
        REFERENCES movie_ai_permissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_uuid
ON movie_ai_permission_overrides(override_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_identity_type
ON movie_ai_permission_overrides(identity_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_identity_id
ON movie_ai_permission_overrides(identity_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_permission
ON movie_ai_permission_overrides(permission_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_agent
ON movie_ai_permission_overrides(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_type
ON movie_ai_permission_overrides(override_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_priority
ON movie_ai_permission_overrides(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_source
ON movie_ai_permission_overrides(assignment_source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_active
ON movie_ai_permission_overrides(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_temporary
ON movie_ai_permission_overrides(is_temporary);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_valid_from
ON movie_ai_permission_overrides(valid_from);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_valid_until
ON movie_ai_permission_overrides(valid_until);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permission_overrides_created
ON movie_ai_permission_overrides(created_at);

COMMIT;