/*
================================================================
Library Of Legends 2.0
Migration: 000088_create_movie_ai_role_permissions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnung zwischen Rollen und
Berechtigungen (RBAC).

Diese Tabelle verbindet Rollen mit ihren
zugewiesenen Berechtigungen und unterstützt
Vererbungen, Prioritäten, Gültigkeits-
zeiträume sowie Einschränkungen.

Unterstützte Funktionen:
- Role-Permission Mapping
- Mehrfachzuweisungen
- Prioritäten
- Vererbungen
- Einschränkungen
- Zeitliche Gültigkeit
- Aktiv/Inaktiv
- Audit-Unterstützung

Erstellt:
- movie_ai_role_permissions

Abhängigkeiten:
- 000086_create_movie_ai_permissions.sql
- 000087_create_movie_ai_roles.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_role_permissions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    mapping_uuid TEXT NOT NULL UNIQUE,

    role_id INTEGER NOT NULL,

    permission_id INTEGER NOT NULL,

    assignment_type TEXT NOT NULL DEFAULT 'direct',

    priority INTEGER NOT NULL DEFAULT 100,

    allow INTEGER NOT NULL DEFAULT 1,

    deny INTEGER NOT NULL DEFAULT 0,

    inherited_from_role_id INTEGER,

    inherited INTEGER NOT NULL DEFAULT 0,

    condition_expression TEXT,

    restrictions TEXT,

    valid_from DATETIME,

    valid_until DATETIME,

    assigned_by TEXT,

    assignment_reason TEXT,

    metadata TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (permission_id)
        REFERENCES movie_ai_permissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (inherited_from_role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_uuid
ON movie_ai_role_permissions(mapping_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_role
ON movie_ai_role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_permission
ON movie_ai_role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_assignment
ON movie_ai_role_permissions(assignment_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_priority
ON movie_ai_role_permissions(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_allow
ON movie_ai_role_permissions(allow);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_deny
ON movie_ai_role_permissions(deny);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_inherited
ON movie_ai_role_permissions(inherited);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_inherited_role
ON movie_ai_role_permissions(inherited_from_role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_valid_from
ON movie_ai_role_permissions(valid_from);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_valid_until
ON movie_ai_role_permissions(valid_until);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_active
ON movie_ai_role_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_role_permissions_created
ON movie_ai_role_permissions(created_at);

COMMIT;