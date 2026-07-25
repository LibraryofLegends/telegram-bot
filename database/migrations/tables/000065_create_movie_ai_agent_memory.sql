/*
================================================================
Library Of Legends 2.0
Migration: 000065_create_movie_ai_agent_memory.sql
----------------------------------------------------------------
Beschreibung:
Erstellt den persistenten Speicher sämtlicher
KI-Agenten innerhalb von Library Of Legends.

Diese Tabelle speichert kurz- und langfristige
Erinnerungen, Gesprächskontexte, gelernte Fakten,
Embeddings, Zusammenfassungen und weitere
Kontextinformationen zur intelligenten
Agentensteuerung.

Erstellt:
- movie_ai_agent_memory

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000062_create_movie_ai_agents.sql
- 000063_create_movie_ai_agent_tasks.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_agent_memory
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    memory_uuid TEXT NOT NULL UNIQUE,

    agent_id INTEGER NOT NULL,

    task_id INTEGER,

    model_id INTEGER,

    memory_type TEXT NOT NULL,

    memory_scope TEXT NOT NULL DEFAULT 'agent',

    title TEXT,

    summary TEXT,

    content TEXT NOT NULL,

    embedding TEXT,

    embedding_model TEXT,

    embedding_dimensions INTEGER,

    importance_score REAL NOT NULL DEFAULT 0,

    confidence_score REAL NOT NULL DEFAULT 1,

    relevance_score REAL,

    access_count INTEGER NOT NULL DEFAULT 0,

    last_accessed_at DATETIME,

    expires_at DATETIME,

    archived_at DATETIME,

    source_type TEXT,

    source_reference TEXT,

    tags TEXT,

    metadata TEXT,

    is_pinned INTEGER NOT NULL DEFAULT 0,

    is_archived INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (task_id)
        REFERENCES movie_ai_agent_tasks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_agent
ON movie_ai_agent_memory(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_task
ON movie_ai_agent_memory(task_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_model
ON movie_ai_agent_memory(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_uuid
ON movie_ai_agent_memory(memory_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_type
ON movie_ai_agent_memory(memory_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_scope
ON movie_ai_agent_memory(memory_scope);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_importance
ON movie_ai_agent_memory(importance_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_confidence
ON movie_ai_agent_memory(confidence_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_access
ON movie_ai_agent_memory(access_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_last_access
ON movie_ai_agent_memory(last_accessed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_expires
ON movie_ai_agent_memory(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_pinned
ON movie_ai_agent_memory(is_pinned);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_archived
ON movie_ai_agent_memory(is_archived);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_active
ON movie_ai_agent_memory(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_memory_created
ON movie_ai_agent_memory(created_at);

COMMIT;