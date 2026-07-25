/*
================================================================
Library Of Legends 2.0
Migration: 000063_create_movie_ai_agent_tasks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Aufgabenverwaltung für
sämtliche KI-Agenten innerhalb von
Library Of Legends.

Diese Tabelle speichert sämtliche Aufgaben,
Workflows und Ausführungen der KI-Agenten
inklusive Status, Prioritäten, Abhängigkeiten,
Ein- und Ausgaben sowie Laufzeitinformationen.

Unterstützte Funktionen:
- Task Queue
- Priorisierung
- Retry-Logik
- Workflow-Steuerung
- Abhängigkeiten
- Scheduling
- Ergebnisverwaltung
- Fehlerprotokollierung
- Agent-Orchestrierung

Erstellt:
- movie_ai_agent_tasks

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_agent_tasks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    agent_id INTEGER NOT NULL,

    parent_task_id INTEGER,

    task_uuid TEXT NOT NULL UNIQUE,

    task_name TEXT NOT NULL,

    task_type TEXT NOT NULL,

    workflow_name TEXT,

    queue_name TEXT,

    priority INTEGER NOT NULL DEFAULT 100,

    status TEXT NOT NULL DEFAULT 'pending',

    scheduled_at DATETIME,

    started_at DATETIME,

    completed_at DATETIME,

    timeout_seconds INTEGER DEFAULT 300,

    retry_count INTEGER NOT NULL DEFAULT 0,

    max_retries INTEGER NOT NULL DEFAULT 3,

    execution_time_ms INTEGER,

    progress_percent INTEGER NOT NULL DEFAULT 0,

    input_data TEXT,

    output_data TEXT,

    result_summary TEXT,

    error_code TEXT,

    error_message TEXT,

    dependency_task_uuid TEXT,

    assigned_worker TEXT,

    created_by TEXT,

    correlation_id TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (parent_task_id)
        REFERENCES movie_ai_agent_tasks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_agent
ON movie_ai_agent_tasks(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_parent
ON movie_ai_agent_tasks(parent_task_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_uuid
ON movie_ai_agent_tasks(task_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_name
ON movie_ai_agent_tasks(task_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_type
ON movie_ai_agent_tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_workflow
ON movie_ai_agent_tasks(workflow_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_queue
ON movie_ai_agent_tasks(queue_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_priority
ON movie_ai_agent_tasks(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_status
ON movie_ai_agent_tasks(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_scheduled
ON movie_ai_agent_tasks(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_started
ON movie_ai_agent_tasks(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_completed
ON movie_ai_agent_tasks(completed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_retry
ON movie_ai_agent_tasks(retry_count);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_dependency
ON movie_ai_agent_tasks(dependency_task_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_correlation
ON movie_ai_agent_tasks(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_agent_tasks_created
ON movie_ai_agent_tasks(created_at);

COMMIT;