/*
================================================================
Library Of Legends 2.0
Migration: 000087_create_movie_ai_roles.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Rollenmodell (RBAC)
für Library Of Legends.

Diese Tabelle definiert sämtliche Rollen
des Systems und bildet die Grundlage für
die spätere Zuordnung von Berechtigungen,
Benutzern, Agenten und Service Accounts.

Unterstützte Funktionen:
- Systemrollen
- Benutzerrollen
- Service-Rollen
- Rollenvererbung
- Prioritäten
- Standardrollen
- Aktiv/Inaktiv
- Zeitliche Gültigkeit
- Hierarchien

Erstellt:
- movie_ai_roles

Abhängigkeiten:
- 000086_create_movie_ai_permissions.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_roles
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    role_uuid TEXT NOT NULL UNIQUE,

    role_key TEXT NOT NULL UNIQUE,

    role_name TEXT NOT NULL,

    description TEXT,

    category TEXT NOT NULL,

    parent_role_id INTEGER,

    priority INTEGER NOT NULL DEFAULT 100,

    hierarchy_level INTEGER NOT NULL DEFAULT 0,

    scope TEXT NOT NULL DEFAULT 'global',

    risk_level TEXT NOT NULL DEFAULT 'low',

    is_system_role INTEGER NOT NULL DEFAULT 1,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_assignable INTEGER NOT NULL DEFAULT 1,

    is_inheritable INTEGER NOT NULL DEFAULT 1,

    is_service_role INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    valid_from DATETIME,

    valid_until DATETIME,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_role_id)
        REFERENCES movie_ai_roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_uuid
ON movie_ai_roles(role_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_key
ON movie_ai_roles(role_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_name
ON movie_ai_roles(role_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_category
ON movie_ai_roles(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_parent
ON movie_ai_roles(parent_role_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_priority
ON movie_ai_roles(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_hierarchy
ON movie_ai_roles(hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_scope
ON movie_ai_roles(scope);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_risk
ON movie_ai_roles(risk_level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_system
ON movie_ai_roles(is_system_role);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_default
ON movie_ai_roles(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_assignable
ON movie_ai_roles(is_assignable);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_inheritable
ON movie_ai_roles(is_inheritable);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_service
ON movie_ai_roles(is_service_role);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_active
ON movie_ai_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_valid_from
ON movie_ai_roles(valid_from);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_valid_until
ON movie_ai_roles(valid_until);

CREATE INDEX IF NOT EXISTS idx_movie_ai_roles_created
ON movie_ai_roles(created_at);

COMMIT;