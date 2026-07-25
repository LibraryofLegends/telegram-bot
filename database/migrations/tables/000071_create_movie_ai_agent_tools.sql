/*
================================================================
Library Of Legends 2.0
Migration: 000071_create_movie_ai_agent_tools.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnung zwischen KI-Agenten
und den verfügbaren Werkzeugen.

Diese Tabelle definiert, welche Agenten
welche Tools verwenden dürfen sowie deren
Konfiguration, Priorität, Berechtigungen,
Fallback-Strategien und Nutzungsgrenzen.

Erstellt:
- movie_ai_agent_tools

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000070_create_movie_ai_tools.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_agent_tools
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    agent_id INTEGER NOT NULL,

    tool_id INTEGER NOT NULL,

    alias TEXT,

    execution_priority INTEGER NOT NULL DEFAULT 100,

    execution_order INTEGER DEFAULT 1,

    permission_level TEXT NOT NULL DEFAULT 'execute',

    configuration TEXT,

    default_parameters TEXT,

    allowed_operations TEXT,

    denied_operations TEXT,

    timeout_seconds INTEGER DEFAULT 60,

    retry_attempts INTEGER DEFAULT 3,

    fallback_tool_id INTEGER,

    fallback_strategy TEXT,

    max_calls_per_run INTEGER,

    max_calls_per_day INTEGER,

    usage_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    last_used_at DATETIME,

    last_success_at DATETIME,

    last_failure_at DATETIME,

    status TEXT NOT NULL DEFAULT 'active',

    is_required INTEGER NOT NULL DEFAULT 0,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (tool_id)
        REFERENCES movie_ai_tools(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (fallback_tool_id)
        REFERENCES movie_ai_tools(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_unique
ON movie_ai_agent_tools(agent_id, tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_agent
ON movie_ai_agent_tools(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_tool
ON movie_ai_agent_tools(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_fallback
ON movie_ai_agent_tools(fallback_tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_priority
ON movie_ai_agent_tools(execution_priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_order
ON movie_ai_agent_tools(execution_order);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_permission
ON movie_ai_agent_tools(permission_level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_status
ON movie_ai_agent_tools(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_required
ON movie_ai_agent_tools(is_required);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_default
ON movie_ai_agent_tools(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_active
ON movie_ai_agent_tools(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_last_used
ON movie_ai_agent_tools(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tools_created
ON movie_ai_agent_tools(created_at);

COMMIT;