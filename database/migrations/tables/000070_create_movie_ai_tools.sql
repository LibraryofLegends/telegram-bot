/*
================================================================
Library Of Legends 2.0
Migration: 000070_create_movie_ai_tools.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tool-Verwaltung für
sämtliche KI-Werkzeuge innerhalb von
Library Of Legends.

Diese Tabelle registriert alle externen und
internen Werkzeuge, die von KI-Agenten
verwendet werden können.

Unterstützte Tools:
- TMDB API
- OMDb API
- Telegram Bot API
- FFmpeg
- Whisper
- Tesseract OCR
- ImageMagick
- Cloudinary
- Eigene Skripte
- Interne Services

Erstellt:
- movie_ai_tools

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_tools
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    tool_name TEXT NOT NULL,

    tool_slug TEXT NOT NULL UNIQUE,

    display_name TEXT,

    description TEXT,

    tool_category TEXT NOT NULL,

    tool_type TEXT NOT NULL,

    provider_name TEXT,

    version TEXT,

    executable_path TEXT,

    endpoint_url TEXT,

    authentication_type TEXT,

    configuration TEXT,

    input_schema TEXT,

    output_schema TEXT,

    supported_formats TEXT,

    permissions TEXT,

    timeout_seconds INTEGER NOT NULL DEFAULT 60,

    retry_attempts INTEGER NOT NULL DEFAULT 3,

    max_parallel_calls INTEGER NOT NULL DEFAULT 1,

    health_status TEXT NOT NULL DEFAULT 'unknown',

    last_health_check DATETIME,

    usage_count INTEGER NOT NULL DEFAULT 0,

    success_count INTEGER NOT NULL DEFAULT 0,

    failure_count INTEGER NOT NULL DEFAULT 0,

    average_runtime_ms INTEGER,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'active',

    is_system INTEGER NOT NULL DEFAULT 0,

    is_internal INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_name
ON movie_ai_tools(tool_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_slug
ON movie_ai_tools(tool_slug);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_category
ON movie_ai_tools(tool_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_type
ON movie_ai_tools(tool_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_provider
ON movie_ai_tools(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_status
ON movie_ai_tools(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_health
ON movie_ai_tools(health_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_priority
ON movie_ai_tools(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_system
ON movie_ai_tools(is_system);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_internal
ON movie_ai_tools(is_internal);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_active
ON movie_ai_tools(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_last_health
ON movie_ai_tools(last_health_check);

CREATE INDEX IF NOT EXISTS idx_movie_ai_tools_created
ON movie_ai_tools(created_at);

COMMIT;