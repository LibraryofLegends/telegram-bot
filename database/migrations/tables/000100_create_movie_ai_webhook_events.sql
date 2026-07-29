/*
================================================================
Library Of Legends 2.0
Migration: 000100_create_movie_ai_webhook_events.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Webhook-
Ereignisregister für Library Of Legends.

Diese Tabelle definiert sämtliche
unterstützten Event-Typen einschließlich
Versionierung, Kategorien,
Payload-Schemata, Prioritäten,
Dokumentation und Aktivierungsstatus.

Unterstützte Funktionen:
- Event Registry
- Event Versionierung
- Kategorien
- Payload Schema
- Prioritäten
- Dokumentation
- Routing
- Aktivierung
- Audit-Unterstützung

Erstellt:
- movie_ai_webhook_events

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_events
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    event_uuid TEXT NOT NULL UNIQUE,

    event_name TEXT NOT NULL UNIQUE,

    display_name TEXT NOT NULL,

    category TEXT NOT NULL,

    subcategory TEXT,

    description TEXT,

    event_version TEXT NOT NULL DEFAULT '1.0',

    payload_schema TEXT,

    payload_example TEXT,

    documentation_url TEXT,

    producer TEXT,

    consumer TEXT,

    routing_key TEXT,

    topic_name TEXT,

    priority TEXT NOT NULL DEFAULT 'normal',

    delivery_mode TEXT NOT NULL DEFAULT 'async',

    retry_supported INTEGER NOT NULL DEFAULT 1,

    ordering_required INTEGER NOT NULL DEFAULT 0,

    idempotent INTEGER NOT NULL DEFAULT 1,

    requires_authentication INTEGER NOT NULL DEFAULT 1,

    signature_required INTEGER NOT NULL DEFAULT 1,

    retention_days INTEGER NOT NULL DEFAULT 30,

    deprecated INTEGER NOT NULL DEFAULT 0,

    replacement_event TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_uuid
ON movie_ai_webhook_events(event_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_name
ON movie_ai_webhook_events(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_display_name
ON movie_ai_webhook_events(display_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_category
ON movie_ai_webhook_events(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_subcategory
ON movie_ai_webhook_events(subcategory);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_version
ON movie_ai_webhook_events(event_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_priority
ON movie_ai_webhook_events(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_delivery
ON movie_ai_webhook_events(delivery_mode);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_active
ON movie_ai_webhook_events(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_deprecated
ON movie_ai_webhook_events(deprecated);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_created
ON movie_ai_webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_events_updated
ON movie_ai_webhook_events(updated_at);

COMMIT;