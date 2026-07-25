/*
================================================================
Library Of Legends 2.0
Migration: 000057_create_movie_ai_models.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung sämtlicher
unterstützter KI-Modelle.

Diese Tabelle dient als zentrale Konfiguration für
alle KI-Anbieter und Modelle innerhalb von
Library Of Legends.

Unterstützte Informationen:
- Anbieter
- Modell
- Version
- Fähigkeiten
- Kontextfenster
- Tokenlimits
- Preisinformationen
- Standardmodell
- Verfügbarkeit
- API-Konfiguration
- Funktionsumfang

Erstellt:
- movie_ai_models

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_models
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    provider_name TEXT NOT NULL,

    model_name TEXT NOT NULL,

    model_slug TEXT NOT NULL UNIQUE,

    model_version TEXT,

    model_family TEXT,

    api_version TEXT,

    endpoint TEXT,

    description TEXT,

    supported_tasks TEXT,

    supported_modalities TEXT,

    supported_languages TEXT,

    context_window INTEGER,

    max_input_tokens INTEGER,

    max_output_tokens INTEGER,

    max_total_tokens INTEGER,

    input_cost_per_million_tokens REAL,

    output_cost_per_million_tokens REAL,

    supports_streaming INTEGER NOT NULL DEFAULT 0,

    supports_function_calling INTEGER NOT NULL DEFAULT 0,

    supports_json_mode INTEGER NOT NULL DEFAULT 0,

    supports_embeddings INTEGER NOT NULL DEFAULT 0,

    supports_vision INTEGER NOT NULL DEFAULT 0,

    supports_audio INTEGER NOT NULL DEFAULT 0,

    supports_video INTEGER NOT NULL DEFAULT 0,

    supports_reasoning INTEGER NOT NULL DEFAULT 0,

    supports_fine_tuning INTEGER NOT NULL DEFAULT 0,

    default_temperature REAL,

    default_top_p REAL,

    default_max_tokens INTEGER,

    status TEXT NOT NULL DEFAULT 'active',

    is_default INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_provider
ON movie_ai_models(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_name
ON movie_ai_models(model_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_slug
ON movie_ai_models(model_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_family
ON movie_ai_models(model_family);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_version
ON movie_ai_models(model_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_status
ON movie_ai_models(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_default
ON movie_ai_models(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_active
ON movie_ai_models(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_embeddings
ON movie_ai_models(supports_embeddings);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_reasoning
ON movie_ai_models(supports_reasoning);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_vision
ON movie_ai_models(supports_vision);

CREATE INDEX IF NOT EXISTS idx_movie_ai_models_created
ON movie_ai_models(created_at);

COMMIT;