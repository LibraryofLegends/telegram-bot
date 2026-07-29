/*
================================================================
Library Of Legends 2.0
Migration: 000084_create_movie_ai_audit_logs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das revisionssichere Audit-Log
für sicherheits- und geschäftskritische
Ereignisse innerhalb von Library Of Legends.

Diese Tabelle speichert ausschließlich
unveränderbare Audit-Einträge zur
Nachvollziehbarkeit administrativer,
sicherheitsrelevanter und systemkritischer
Aktionen.

Unterstützte Funktionen:
- Login-/Logout-Protokollierung
- Rollenänderungen
- Berechtigungsänderungen
- API-Key-Verwaltung
- Workflow-Änderungen
- Datenänderungen
- Integritätsprüfung
- Revisionssicherheit

Erstellt:
- movie_ai_audit_logs

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000070_create_movie_ai_tools.sql
- 000082_create_movie_ai_logs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_audit_logs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    audit_uuid TEXT NOT NULL UNIQUE,

    audit_type TEXT NOT NULL,

    category TEXT NOT NULL,

    action TEXT NOT NULL,

    severity TEXT NOT NULL DEFAULT 'info',

    provider_id INTEGER,

    model_id INTEGER,

    workflow_id INTEGER,

    agent_id INTEGER,

    tool_id INTEGER,

    log_id INTEGER,

    user_id TEXT,

    username TEXT,

    role_name TEXT,

    session_id TEXT,

    correlation_id TEXT,

    request_id TEXT,

    resource_type TEXT,

    resource_id TEXT,

    resource_name TEXT,

    old_value TEXT,

    new_value TEXT,

    changed_fields TEXT,

    reason TEXT,

    message TEXT NOT NULL,

    ip_address TEXT,

    user_agent TEXT,

    host_name TEXT,

    process_id INTEGER,

    success INTEGER NOT NULL DEFAULT 1,

    checksum TEXT,

    signature TEXT,

    metadata TEXT,

    audited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (provider_id)
        REFERENCES movie_ai_providers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (model_id)
        REFERENCES movie_ai_models(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (tool_id)
        REFERENCES movie_ai_tools(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (log_id)
        REFERENCES movie_ai_logs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_uuid
ON movie_ai_audit_logs(audit_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_type
ON movie_ai_audit_logs(audit_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_category
ON movie_ai_audit_logs(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_action
ON movie_ai_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_severity
ON movie_ai_audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_provider
ON movie_ai_audit_logs(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_model
ON movie_ai_audit_logs(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_workflow
ON movie_ai_audit_logs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_agent
ON movie_ai_audit_logs(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_tool
ON movie_ai_audit_logs(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_log
ON movie_ai_audit_logs(log_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_user
ON movie_ai_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_session
ON movie_ai_audit_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_correlation
ON movie_ai_audit_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_resource
ON movie_ai_audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_success
ON movie_ai_audit_logs(success);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_audited
ON movie_ai_audit_logs(audited_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_logs_created
ON movie_ai_audit_logs(created_at);

COMMIT;