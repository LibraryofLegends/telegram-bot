/*
================================================================
Library Of Legends 2.0
Migration: 000056_create_movie_ai_prompt_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historien-Tabelle für sämtliche
KI-Prompt-Ausführungen.

Diese Tabelle protokolliert jede Ausführung eines
Prompts vollständig und dient der Analyse,
Nachvollziehbarkeit sowie Optimierung der
KI-Workflows.

Erfasste Informationen:
- Prompt-Version
- Modell
- Provider
- Eingaben
- Ausgaben
- Tokenverbrauch
- Laufzeit
- Kosten
- Status
- Fehler
- Parameter
- Benutzer
- Session
- Metadaten

Erstellt:
- movie_ai_prompt_history

Abhängigkeiten:
- 000055_create_movie_ai_prompts.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_prompt_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    prompt_id INTEGER NOT NULL,

    prompt_uuid TEXT NOT NULL,

    execution_uuid TEXT NOT NULL UNIQUE,

    provider TEXT NOT NULL,

    model_name TEXT NOT NULL,

    model_version TEXT,

    prompt_version TEXT NOT NULL,

    prompt_type TEXT,

    session_id TEXT,

    user_id TEXT,

    correlation_id TEXT,

    request_payload TEXT,

    response_payload TEXT,

    rendered_prompt TEXT,

    system_prompt TEXT,

    developer_prompt TEXT,

    user_prompt TEXT,

    response_text TEXT,

    input_tokens INTEGER NOT NULL DEFAULT 0,

    output_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    estimated_cost REAL DEFAULT 0,

    execution_time_ms INTEGER,

    status TEXT NOT NULL,

    finish_reason TEXT,

    error_code TEXT,

    error_message TEXT,

    temperature REAL,

    top_p REAL,

    max_tokens INTEGER,

    frequency_penalty REAL,

    presence_penalty REAL,

    metadata TEXT,

    executed_at DATETIME NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (prompt_id)
        REFERENCES movie_ai_prompts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_prompt
ON movie_ai_prompt_history(prompt_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_prompt_uuid
ON movie_ai_prompt_history(prompt_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_execution
ON movie_ai_prompt_history(execution_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_provider
ON movie_ai_prompt_history(provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_model
ON movie_ai_prompt_history(model_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_version
ON movie_ai_prompt_history(prompt_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_status
ON movie_ai_prompt_history(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_session
ON movie_ai_prompt_history(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_user
ON movie_ai_prompt_history(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_correlation
ON movie_ai_prompt_history(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_tokens
ON movie_ai_prompt_history(total_tokens);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_runtime
ON movie_ai_prompt_history(execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_movie_ai_prompt_history_executed
ON movie_ai_prompt_history(executed_at);

COMMIT;