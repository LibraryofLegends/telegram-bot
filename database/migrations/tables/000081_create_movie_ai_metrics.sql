/*
================================================================
Library Of Legends 2.0
Migration: 000081_create_movie_ai_metrics.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Metriksystem für
sämtliche System-, KI-, Workflow-, Agenten-,
Queue- und Tool-Metriken innerhalb von
Library Of Legends.

Diese Tabelle speichert Performance-,
Kosten-, Ressourcen- und Nutzungsmetriken
zur Auswertung in Dashboards und
Monitoring-Systemen.

Unterstützte Funktionen:
- CPU-Auslastung
- RAM-Auslastung
- Tokenverbrauch
- API-Kosten
- Antwortzeiten
- Fehlerraten
- Durchsatz
- Benutzerdefinierte Kennzahlen
- Zeitreihenanalyse

Erstellt:
- movie_ai_metrics

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000070_create_movie_ai_tools.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_metrics
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    metric_uuid TEXT NOT NULL UNIQUE,

    metric_name TEXT NOT NULL,

    metric_category TEXT NOT NULL,

    metric_type TEXT NOT NULL,

    provider_id INTEGER,

    model_id INTEGER,

    agent_id INTEGER,

    workflow_id INTEGER,

    tool_id INTEGER,

    resource_type TEXT,

    resource_id TEXT,

    metric_value REAL NOT NULL,

    metric_unit TEXT,

    aggregation_type TEXT DEFAULT 'raw',

    sample_count INTEGER NOT NULL DEFAULT 1,

    minimum_value REAL,

    maximum_value REAL,

    average_value REAL,

    percentile_50 REAL,

    percentile_95 REAL,

    percentile_99 REAL,

    time_window TEXT,

    recorded_at DATETIME NOT NULL,

    source TEXT,

    tags TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (tool_id)
        REFERENCES movie_ai_tools(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_uuid
ON movie_ai_metrics(metric_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_name
ON movie_ai_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_category
ON movie_ai_metrics(metric_category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_type
ON movie_ai_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_provider
ON movie_ai_metrics(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_model
ON movie_ai_metrics(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_agent
ON movie_ai_metrics(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_workflow
ON movie_ai_metrics(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_tool
ON movie_ai_metrics(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_resource
ON movie_ai_metrics(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_recorded
ON movie_ai_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_source
ON movie_ai_metrics(source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_metrics_created
ON movie_ai_metrics(created_at);

COMMIT;