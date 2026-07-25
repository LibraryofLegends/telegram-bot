/*
================================================================
Library Of Legends 2.0
Migration: 000055_create_movie_ai_prompts.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Prompt-Datenbank für alle
KI-gestützten Funktionen innerhalb von
Library Of Legends.

Diese Tabelle speichert sämtliche System-, Benutzer-
und Workflow-Prompts inklusive Versionierung,
Variablen, Modellzuordnung und Ausführungsstatistiken.

Unterstützte Prompt-Typen:
- System Prompt
- User Prompt
- Developer Prompt
- Workflow Prompt
- Analyse Prompt
- Such Prompt
- Empfehlungs Prompt
- Embedding Prompt
- Übersetzungs Prompt
- Zusammenfassungs Prompt

Erstellt:
- movie_ai_prompts

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_prompts
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    prompt_name TEXT NOT NULL,

    prompt_key TEXT NOT NULL UNIQUE,

    prompt_type TEXT NOT NULL,

    prompt_category TEXT,

    provider TEXT NOT NULL,

    model_name TEXT NOT NULL,

    model_version TEXT,

    prompt_version TEXT NOT NULL,

    system_prompt TEXT,

    developer_prompt TEXT,

    user_prompt TEXT,

    prompt_template TEXT NOT NULL,

    variables TEXT,

    parameters TEXT,

    temperature REAL,

    top_p REAL,

    max_tokens INTEGER,

    frequency_penalty REAL,

    presence_penalty REAL,

    stop_sequences TEXT,

    response_format TEXT,

    execution_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    error_count INTEGER NOT NULL DEFAULT 0,

    average_runtime_ms INTEGER,

    average_token_usage INTEGER,

    last_used_at DATETIME,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_key
ON movie_ai_prompts(prompt_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_name
ON movie_ai_prompts(prompt_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_type
ON movie_ai_prompts(prompt_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_category
ON movie_ai_prompts(prompt_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_provider
ON movie_ai_prompts(provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_model
ON movie_ai_prompts(model_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_version
ON movie_ai_prompts(prompt_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_default
ON movie_ai_prompts(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_active
ON movie_ai_prompts(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_last_used
ON movie_ai_prompts(last_used_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_execution_count
ON movie_ai_prompts(execution_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompts_created
ON movie_ai_prompts(created_at);

COMMIT;