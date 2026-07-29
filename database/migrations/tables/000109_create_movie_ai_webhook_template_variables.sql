/*
================================================================
Library Of Legends 2.0
Migration: 000109_create_movie_ai_webhook_template_variables.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung
sämtlicher Template-Variablen für
Webhook-Templates.

Diese Tabelle definiert Variablen,
Datentypen, Standardwerte,
Validierungsregeln, Transformationen,
Formatierungen sowie Dokumentationen.

Unterstützte Funktionen:
- Template Variablen
- Datentypen
- Standardwerte
- Pflichtfelder
- Validierung
- Transformationen
- Formatierung
- Dokumentation
- Aktivierung
- Audit

Erstellt:
- movie_ai_webhook_template_variables

Abhängigkeiten:
- 000108_create_movie_ai_webhook_templates.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_template_variables
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    variable_uuid TEXT NOT NULL UNIQUE,

    template_id INTEGER NOT NULL,

    variable_name TEXT NOT NULL,

    display_name TEXT,

    description TEXT,

    data_type TEXT NOT NULL,

    format_type TEXT,

    default_value TEXT,

    example_value TEXT,

    placeholder TEXT,

    validation_pattern TEXT,

    validation_schema TEXT,

    minimum_value REAL,

    maximum_value REAL,

    minimum_length INTEGER,

    maximum_length INTEGER,

    allowed_values TEXT,

    transformation_rule TEXT,

    formatter TEXT,

    required INTEGER NOT NULL DEFAULT 0,

    nullable INTEGER NOT NULL DEFAULT 1,

    unique_value INTEGER NOT NULL DEFAULT 0,

    encrypted INTEGER NOT NULL DEFAULT 0,

    masked INTEGER NOT NULL DEFAULT 0,

    sortable INTEGER NOT NULL DEFAULT 0,

    searchable INTEGER NOT NULL DEFAULT 0,

    exportable INTEGER NOT NULL DEFAULT 1,

    documentation TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_system_variable INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    created_by TEXT,

    updated_by TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (template_id)
        REFERENCES movie_ai_webhook_templates(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_uuid
ON movie_ai_webhook_template_variables(variable_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_template
ON movie_ai_webhook_template_variables(template_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_name
ON movie_ai_webhook_template_variables(variable_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_type
ON movie_ai_webhook_template_variables(data_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_format
ON movie_ai_webhook_template_variables(format_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_required
ON movie_ai_webhook_template_variables(required);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_system
ON movie_ai_webhook_template_variables(is_system_variable);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_active
ON movie_ai_webhook_template_variables(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_order
ON movie_ai_webhook_template_variables(sort_order);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_created
ON movie_ai_webhook_template_variables(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_template_variables_updated
ON movie_ai_webhook_template_variables(updated_at);

COMMIT;