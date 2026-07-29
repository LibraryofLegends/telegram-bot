/*
================================================================
Library Of Legends 2.0
Migration: 000083_create_movie_ai_log_archives.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Log-Archivsystem für
Library Of Legends.

Diese Tabelle dient der langfristigen
Archivierung älterer Logeinträge, um die
aktive Log-Tabelle performant zu halten.

Archiviert werden sämtliche Informationen
eines ursprünglichen Logeintrags inklusive
Metadaten, Stacktraces, Korrelationsdaten
und Archivinformationen.

Unterstützte Funktionen:
- Langzeitarchivierung
- Audit-Trail
- Performance-Optimierung
- Compliance
- Wiederherstellung
- Vollständige Historie

Erstellt:
- movie_ai_log_archives

Abhängigkeiten:
- 000082_create_movie_ai_logs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_log_archives
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    archive_uuid TEXT NOT NULL UNIQUE,

    original_log_id INTEGER NOT NULL,

    original_log_uuid TEXT NOT NULL,

    level TEXT NOT NULL,

    category TEXT NOT NULL,

    source TEXT NOT NULL,

    event_name TEXT NOT NULL,

    provider_id INTEGER,

    model_id INTEGER,

    workflow_id INTEGER,

    agent_id INTEGER,

    tool_id INTEGER,

    scheduler_id INTEGER,

    queue_job_id INTEGER,

    session_id TEXT,

    correlation_id TEXT,

    request_id TEXT,

    user_id TEXT,

    resource_type TEXT,

    resource_id TEXT,

    message TEXT NOT NULL,

    details TEXT,

    stack_trace TEXT,

    exception_type TEXT,

    file_name TEXT,

    line_number INTEGER,

    function_name TEXT,

    host_name TEXT,

    process_id INTEGER,

    thread_id TEXT,

    ip_address TEXT,

    metadata TEXT,

    logged_at DATETIME,

    archived_by TEXT,

    archive_reason TEXT,

    archive_batch TEXT,

    archive_location TEXT,

    restored_at DATETIME,

    restored_by TEXT,

    is_restored INTEGER NOT NULL DEFAULT 0,

    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (original_log_id)
        REFERENCES movie_ai_logs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

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

    FOREIGN KEY (scheduler_id)
        REFERENCES movie_ai_scheduler(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (queue_job_id)
        REFERENCES movie_ai_queue(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_original_log
ON movie_ai_log_archives(original_log_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_uuid
ON movie_ai_log_archives(archive_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_level
ON movie_ai_log_archives(level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_category
ON movie_ai_log_archives(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_source
ON movie_ai_log_archives(source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_event
ON movie_ai_log_archives(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_provider
ON movie_ai_log_archives(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_model
ON movie_ai_log_archives(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_workflow
ON movie_ai_log_archives(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_agent
ON movie_ai_log_archives(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_tool
ON movie_ai_log_archives(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_scheduler
ON movie_ai_log_archives(scheduler_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_queue
ON movie_ai_log_archives(queue_job_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_session
ON movie_ai_log_archives(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_correlation
ON movie_ai_log_archives(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_logged
ON movie_ai_log_archives(logged_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_archived
ON movie_ai_log_archives(archived_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_restored
ON movie_ai_log_archives(is_restored);

CREATE INDEX IF NOT EXISTS idx_movie_ai_log_archives_created
ON movie_ai_log_archives(created_at);

COMMIT;