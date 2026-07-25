/*
================================================================
Library Of Legends 2.0
Migration: 000061_create_movie_ai_cache.sql
----------------------------------------------------------------
Beschreibung:
Erstellt den zentralen KI-Cache für sämtliche
KI-Anfragen innerhalb von Library Of Legends.

Diese Tabelle speichert bereits berechnete
KI-Antworten zwischen und reduziert dadurch
API-Kosten, Antwortzeiten und Tokenverbrauch.

Unterstützte Funktionen:
- Prompt-Hashing
- Response-Caching
- Providerübergreifender Cache
- Modellabhängiger Cache
- Ablaufzeiten (TTL)
- Trefferstatistiken
- Token-Ersparnis
- Kosten-Ersparnis
- Cache-Strategien

Erstellt:
- movie_ai_cache

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_cache
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    provider_id INTEGER NOT NULL,

    model_id INTEGER NOT NULL,

    cache_key TEXT NOT NULL UNIQUE,

    prompt_hash TEXT NOT NULL,

    prompt_checksum TEXT,

    request_hash TEXT,

    cache_strategy TEXT NOT NULL DEFAULT 'standard',

    request_type TEXT,

    language_code TEXT,

    response_text TEXT,

    response_json TEXT,

    response_size_bytes INTEGER,

    input_tokens INTEGER NOT NULL DEFAULT 0,

    output_tokens INTEGER NOT NULL DEFAULT 0,

    total_tokens INTEGER NOT NULL DEFAULT 0,

    saved_tokens INTEGER NOT NULL DEFAULT 0,

    estimated_saved_cost REAL NOT NULL DEFAULT 0,

    hit_count INTEGER NOT NULL DEFAULT 0,

    miss_count INTEGER NOT NULL DEFAULT 0,

    last_hit_at DATETIME,

    expires_at DATETIME,

    ttl_seconds INTEGER,

    is_expired INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_provider
ON movie_ai_cache(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_model
ON movie_ai_cache(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_key
ON movie_ai_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_prompt_hash
ON movie_ai_cache(prompt_hash);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_request_hash
ON movie_ai_cache(request_hash);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_strategy
ON movie_ai_cache(cache_strategy);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_request_type
ON movie_ai_cache(request_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_language
ON movie_ai_cache(language_code);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_hit_count
ON movie_ai_cache(hit_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_last_hit
ON movie_ai_cache(last_hit_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_expires
ON movie_ai_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_active
ON movie_ai_cache(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_cache_created
ON movie_ai_cache(created_at);

COMMIT;