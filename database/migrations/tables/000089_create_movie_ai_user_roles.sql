/*
================================================================
Library Of Legends 2.0
Migration: 000089_create_movie_ai_user_roles.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnung zwischen Benutzern,
Administratoren, Service Accounts,
KI-Agenten und Rollen.

Diese Tabelle bildet die Identitäts-
zuordnung des RBAC-Systems und unterstützt
mehrere Rollen pro Identität, zeitlich
begrenzte Rollen, Delegationen sowie
temporäre Berechtigungen.

Unterstützte Funktionen:
- User ↔ Rollen
- Mehrfachrollen
- Delegationen
- Temporäre Rollen
- Aktiv/Inaktiv
- Ablaufdatum
- Audit-Unterstützung

Erstellt:
- movie_ai_user_roles

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000087_create_movie_ai_roles.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_user_roles
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    assignment_uuid TEXT NOT NULL UNIQUE,

    identity_type TEXT NOT NULL,

    identity_id TEXT NOT NULL,

    username TEXT,

    display_name TEXT,

    role_id INTEGER NOT NULL,

    agent_id INTEGER,

    assigned_by TEXT,

    delegated_by TEXT,

    assignment_reason TEXT,

    assignment_source TEXT NOT NULL DEFAULT 'manual',

    priority INTEGER NOT NULL DEFAULT 100,

    is_primary_role INTEGER NOT NULL DEFAULT 0,

    is_delegated INTEGER NOT NULL DEFAULT 0,

    is_temporary INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    valid_from DATETIME,

    valid_until DATETIME,

    last_used_at DATETIME,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_uuid
ON movie_ai_user_roles(assignment_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_identity_type
ON movie_ai_user_roles(identity_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_identity_id
ON movie_ai_user_roles(identity_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_username
ON movie_ai_user_roles(username);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_role
ON movie_ai_user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_agent
ON movie_ai_user_roles(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_source
ON movie_ai_user_roles(assignment_source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_priority
ON movie_ai_user_roles(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_primary
ON movie_ai_user_roles(is_primary_role);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_delegated
ON movie_ai_user_roles(is_delegated);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_temporary
ON movie_ai_user_roles(is_temporary);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_active
ON movie_ai_user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_valid_from
ON movie_ai_user_roles(valid_from);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_valid_until
ON movie_ai_user_roles(valid_until);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_last_used
ON movie_ai_user_roles(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_user_roles_created
ON movie_ai_user_roles(created_at);

COMMIT;