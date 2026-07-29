/*
================================================================
Library Of Legends 2.0
Migration: 000108_create_movie_ai_webhook_templates.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung
wiederverwendbarer Webhook-Templates.

Diese Tabelle speichert Vorlagen für
Webhook-Payloads, Header,
Authentifizierung, Signaturen sowie
Render- und Validierungsoptionen.

Unterstützte Funktionen:
- Payload Templates
- Header Templates
- Signaturvorlagen
- Versionierung
- Template Rendering
- Content Types
- Standardwerte
- Validierung
- Aktivierung
- Audit

Erstellt:
- movie_ai_webhook_templates

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_templates
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    template_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER,

    template_name TEXT NOT NULL,

    display_name TEXT,

    description TEXT,

    template_type TEXT NOT NULL,

    template_version TEXT NOT NULL DEFAULT '1.0',

    content_type TEXT NOT NULL DEFAULT 'application/json',

    payload_template TEXT,

    header_template TEXT,

    query_parameter_template TEXT,

    authentication_template TEXT,

    signature_template TEXT,

    response_template TEXT,

    render_engine TEXT NOT NULL DEFAULT 'mustache',

    escape_output INTEGER NOT NULL DEFAULT 1,

    validation_schema TEXT,

    default_values TEXT,

    supported_variables TEXT,

    required_variables TEXT,

    optional_variables TEXT,

    variable_prefix TEXT DEFAULT '{{',

    variable_suffix TEXT DEFAULT '}}',

    cache_enabled INTEGER NOT NULL DEFAULT 1,

    cache_ttl_seconds INTEGER DEFAULT 300,

    compression_enabled INTEGER NOT NULL DEFAULT 0,

    encryption_required INTEGER NOT NULL DEFAULT 0,

    checksum_algorithm TEXT,

    checksum_value TEXT,

    is_default INTEGER NOT NULL DEFAULT 0,

    is_system_template INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_by TEXT,

    updated_by TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_uuid
ON movie_ai_webhook_templates(template_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_webhook
ON movie_ai_webhook_templates(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_name
ON movie_ai_webhook_templates(template_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_display_name
ON movie_ai_webhook_templates(display_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_type
ON movie_ai_webhook_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_version
ON movie_ai_webhook_templates(template_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_content_type
ON movie_ai_webhook_templates(content_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_render_engine
ON movie_ai_webhook_templates(render_engine);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_default
ON movie_ai_webhook_templates(is_default);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_system
ON movie_ai_webhook_templates(is_system_template);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_active
ON movie_ai_webhook_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_created
ON movie_ai_webhook_templates(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_templates_updated
ON movie_ai_webhook_templates(updated_at);

COMMIT;