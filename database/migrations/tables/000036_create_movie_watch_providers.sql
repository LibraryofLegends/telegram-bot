/*
================================================================
Library Of Legends 2.0
Migration: 000036_create_movie_watch_providers.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Streaming-,
Kauf- und Leihanbieter von Filmen.

Diese Tabelle speichert sämtliche Plattformen,
über die ein Film verfügbar ist.

Unterstützte Anbieter:
- Netflix
- Disney+
- Prime Video
- Apple TV
- Paramount+
- WOW
- RTL+
- Joyn
- Plex
- YouTube
- Google TV
- Rakuten TV
- Microsoft Store
- Sky
- Weitere Anbieter

Unterstützte Angebotsarten:
- Streaming
- Kauf
- Leihe
- Kostenlos
- Werbung

Erstellt:
- movie_watch_providers

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_watch_providers
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    provider_name TEXT NOT NULL,

    provider_type TEXT NOT NULL,

    country_code TEXT,

    language TEXT,

    url TEXT,

    deeplink TEXT,

    price DECIMAL(10,2),

    currency TEXT,

    quality TEXT,

    audio_languages TEXT,

    subtitle_languages TEXT,

    available_from DATETIME,

    available_until DATETIME,

    is_subscription INTEGER NOT NULL DEFAULT 0,

    is_free INTEGER NOT NULL DEFAULT 0,

    has_ads INTEGER NOT NULL DEFAULT 0,

    is_hd INTEGER NOT NULL DEFAULT 0,

    is_4k INTEGER NOT NULL DEFAULT 0,

    is_hdr INTEGER NOT NULL DEFAULT 0,

    is_dolby_vision INTEGER NOT NULL DEFAULT 0,

    is_dolby_atmos INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    last_checked_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_movie
ON movie_watch_providers(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_provider
ON movie_watch_providers(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_type
ON movie_watch_providers(provider_type);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_country
ON movie_watch_providers(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_quality
ON movie_watch_providers(quality);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_subscription
ON movie_watch_providers(is_subscription);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_free
ON movie_watch_providers(is_free);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_active
ON movie_watch_providers(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_available_from
ON movie_watch_providers(available_from);

CREATE INDEX IF NOT EXISTS idx_movie_watch_providers_available_until
ON movie_watch_providers(available_until);

COMMIT;