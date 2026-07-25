/*
================================================================
Library Of Legends 2.0
Migration: 000062_create_movie_ai_agents.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Agentenverwaltung für
sämtliche KI-Agenten innerhalb von
Library Of Legends.

Diese Tabelle verwaltet alle autonomen und
halbautonomen KI-Agenten inklusive Rollen,
Fähigkeiten, Modelle, Provider, Werkzeuge,
Konfigurationen und Berechtigungen.

Unterstützte Agenten:
- Metadata Agent
- Import Agent
- Recommendation Agent
- Search Agent
- Translation Agent
- Quality Agent
- Telegram Agent
- Index Agent
- Analysis Agent
- Moderation Agent
- Backup Agent
- Custom Agents

Erstellt:
- movie_ai_agents

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_agents
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    agent_name TEXT NOT NULL,

    agent_slug TEXT NOT NULL UNIQUE,

    display_name TEXT,

    description TEXT,

    provider_id INTEGER,

    model_id INTEGER,

    agent_role TEXT NOT NULL,

    agent_category TEXT,

    version TEXT NOT NULL,

    capabilities TEXT,

    supported_tools TEXT,

    permissions TEXT,

    system_prompt TEXT,

    default_prompt_id INTEGER,

    configuration TEXT,

    memory_enabled INTEGER NOT NULL DEFAULT 1,

    reasoning_enabled INTEGER NOT NULL DEFAULT 1,

    autonomous INTEGER NOT NULL DEFAULT 0,

    max_iterations INTEGER DEFAULT 10,

    max_runtime_seconds INTEGER DEFAULT 300,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'active',

    last_run_at DATETIME,

    execution_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    average_runtime_ms INTEGER,

    average_token_usage INTEGER,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (default_prompt_id)
        REFERENCES movie_ai_prompts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_name
ON movie_ai_agents(agent_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_slug
ON movie_ai_agents(agent_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_provider
ON movie_ai_agents(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_model
ON movie_ai_agents(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_prompt
ON movie_ai_agents(default_prompt_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_role
ON movie_ai_agents(agent_role);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_category
ON movie_ai_agents(agent_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_status
ON movie_ai_agents(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_priority
ON movie_ai_agents(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_active
ON movie_ai_agents(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_default
ON movie_ai_agents(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_last_run
ON movie_ai_agents(last_run_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agents_created
ON movie_ai_agents(created_at);

COMMIT;