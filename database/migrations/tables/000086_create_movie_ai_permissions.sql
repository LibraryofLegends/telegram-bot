/*
================================================================
Library Of Legends 2.0
Migration: 000086_create_movie_ai_permissions.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Berechtigungssystem
für Library Of Legends.

Diese Tabelle definiert sämtliche
verfügbaren Berechtigungen für Agenten,
Workflows, Tools, Scheduler, Queue,
Administratoren und zukünftige
Systemkomponenten.

Unterstützte Funktionen:
- Rollenbasierte Berechtigungen (RBAC)
- Ressourcen
- Aktionen
- Bereiche (Scopes)
- Standardberechtigungen
- Vererbung
- Prioritäten
- Aktiv/Inaktiv
- Systemberechtigungen

Erstellt:
- movie_ai_permissions

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_permissions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    permission_uuid TEXT NOT NULL UNIQUE,

    permission_key TEXT NOT NULL UNIQUE,

    permission_name TEXT NOT NULL,

    description TEXT,

    category TEXT NOT NULL,

    resource_type TEXT NOT NULL,

    resource_name TEXT,

    action TEXT NOT NULL,

    scope TEXT NOT NULL DEFAULT 'global',

    parent_permission_id INTEGER,

    priority INTEGER NOT NULL DEFAULT 100,

    risk_level TEXT NOT NULL DEFAULT 'low',

    is_system_permission INTEGER NOT NULL DEFAULT 1,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_assignable INTEGER NOT NULL DEFAULT 1,

    is_inheritable INTEGER NOT NULL DEFAULT 1,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_permission_id)
        REFERENCES movie_ai_permissions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_uuid
ON movie_ai_permissions(permission_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_key
ON movie_ai_permissions(permission_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_name
ON movie_ai_permissions(permission_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_category
ON movie_ai_permissions(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_resource_type
ON movie_ai_permissions(resource_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_resource_name
ON movie_ai_permissions(resource_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_action
ON movie_ai_permissions(action);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_scope
ON movie_ai_permissions(scope);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_parent
ON movie_ai_permissions(parent_permission_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_priority
ON movie_ai_permissions(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_risk
ON movie_ai_permissions(risk_level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_system
ON movie_ai_permissions(is_system_permission);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_default
ON movie_ai_permissions(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_assignable
ON movie_ai_permissions(is_assignable);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_inheritable
ON movie_ai_permissions(is_inheritable);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_active
ON movie_ai_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_permissions_created
ON movie_ai_permissions(created_at);

COMMIT;