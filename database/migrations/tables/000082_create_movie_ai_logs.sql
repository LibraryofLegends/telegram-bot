/*
================================================================
Library Of Legends 2.0
Migration: 000082_create_movie_ai_logs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Log-System für
Library Of Legends.

Diese Tabelle speichert sämtliche
System-, KI-, Workflow-, Scheduler-,
Queue-, API-, Tool- und Import-Logs.

Unterstützte Funktionen:
- Mehrere Log-Level
- Strukturierte Logdaten
- Stacktraces
- Correlation IDs
- Session IDs
- Benutzerbezug
- Debugging
- Auditing
- Monitoring

Erstellt:
- movie_ai_logs

Abhängigkeiten:
- 000057_create_movie_ai_models.sql
- 000058_create_movie_ai_providers.sql
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000070_create_movie_ai_tools.sql
- 000076_create_movie_ai_scheduler.sql
- 000078_create_movie_ai_queue.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_logs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    log_uuid TEXT NOT NULL UNIQUE,

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

    logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    FOREIGN KEY (scheduler_id)
        REFERENCES movie_ai_scheduler(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (queue_job_id)
        REFERENCES movie_ai_queue(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_uuid
ON movie_ai_logs(log_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_level
ON movie_ai_logs(level);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_category
ON movie_ai_logs(category);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_source
ON movie_ai_logs(source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_event
ON movie_ai_logs(event_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_provider
ON movie_ai_logs(provider_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_model
ON movie_ai_logs(model_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_workflow
ON movie_ai_logs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_agent
ON movie_ai_logs(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_tool
ON movie_ai_logs(tool_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_scheduler
ON movie_ai_logs(scheduler_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_queue
ON movie_ai_logs(queue_job_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_session
ON movie_ai_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_correlation
ON movie_ai_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_request
ON movie_ai_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_user
ON movie_ai_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_logged
ON movie_ai_logs(logged_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_logs_created
ON movie_ai_logs(created_at);

COMMIT;