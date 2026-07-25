/*
================================================================
Library Of Legends 2.0
Migration: 000058_create_movie_ai_providers.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung sämtlicher
KI-Anbieter innerhalb von Library Of Legends.

Diese Tabelle dient als zentrale Konfiguration
für externe und lokale KI-Dienste.

Unterstützte Provider:
- OpenAI
- Anthropic
- Google
- xAI
- Mistral
- Cohere
- DeepSeek
- OpenRouter
- Ollama
- LM Studio
- Eigene APIs

Erstellt:
- movie_ai_providers

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_providers
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    provider_name TEXT NOT NULL,

    provider_slug TEXT NOT NULL UNIQUE,

    display_name TEXT,

    description TEXT,

    website_url TEXT,

    api_base_url TEXT,

    authentication_type TEXT,

    api_version TEXT,

    organization_id TEXT,

    supports_chat INTEGER NOT NULL DEFAULT 0,

    supports_embeddings INTEGER NOT NULL DEFAULT 0,

    supports_images INTEGER NOT NULL DEFAULT 0,

    supports_audio INTEGER NOT NULL DEFAULT 0,

    supports_video INTEGER NOT NULL DEFAULT 0,

    supports_reasoning INTEGER NOT NULL DEFAULT 0,

    supports_streaming INTEGER NOT NULL DEFAULT 0,

    supports_function_calling INTEGER NOT NULL DEFAULT 0,

    supports_json_mode INTEGER NOT NULL DEFAULT 0,

    requests_per_minute INTEGER,

    tokens_per_minute INTEGER,

    daily_request_limit INTEGER,

    monthly_request_limit INTEGER,

    monthly_budget REAL,

    timeout_seconds INTEGER DEFAULT 60,

    retry_attempts INTEGER DEFAULT 3,

    retry_delay_ms INTEGER DEFAULT 1000,

    health_check_url TEXT,

    health_status TEXT DEFAULT 'unknown',

    last_health_check DATETIME,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'active',

    is_default INTEGER NOT NULL DEFAULT 0,

    is_local_provider INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_name
ON movie_ai_providers(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_slug
ON movie_ai_providers(provider_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_status
ON movie_ai_providers(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_default
ON movie_ai_providers(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_active
ON movie_ai_providers(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_local
ON movie_ai_providers(is_local_provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_priority
ON movie_ai_providers(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_health
ON movie_ai_providers(health_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_chat
ON movie_ai_providers(supports_chat);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_embeddings
ON movie_ai_providers(supports_embeddings);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_reasoning
ON movie_ai_providers(supports_reasoning);

CREATE INDEX IF NOT EXISTS idx_movie_ai_providers_created
ON movie_ai_providers(created_at);

COMMIT;