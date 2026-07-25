/*
================================================================
Library Of Legends 2.0
Migration: 000080_create_movie_ai_locks.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das verteilte Sperrsystem
(Distributed Locking) für sämtliche
kritischen Ressourcen innerhalb von
Library Of Legends.

Diese Tabelle verhindert parallele
Ausführungen derselben Ressource und
verwaltet Sperren für Agenten,
Workflows, Queue-Jobs, Scheduler,
Importe und weitere Prozesse.

Unterstützte Funktionen:
- Distributed Locks
- Lock Owner
- TTL
- Heartbeats
- Automatische Freigabe
- Prioritäten
- Konflikterkennung
- Ablaufverwaltung

Erstellt:
- movie_ai_locks

Abhängigkeiten:
- 000062_create_movie_ai_agents.sql
- 000066_create_movie_ai_workflows.sql
- 000076_create_movie_ai_scheduler.sql
- 000078_create_movie_ai_queue.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_locks
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    lock_uuid TEXT NOT NULL UNIQUE,

    resource_type TEXT NOT NULL,

    resource_id TEXT NOT NULL,

    resource_name TEXT,

    lock_key TEXT NOT NULL UNIQUE,

    owner_type TEXT NOT NULL,

    owner_id TEXT NOT NULL,

    agent_id INTEGER,

    workflow_id INTEGER,

    scheduler_id INTEGER,

    queue_job_id INTEGER,

    lock_scope TEXT NOT NULL DEFAULT 'exclusive',

    priority INTEGER NOT NULL DEFAULT 100,

    acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME NOT NULL,

    released_at DATETIME,

    last_heartbeat_at DATETIME,

    heartbeat_interval_seconds INTEGER NOT NULL DEFAULT 30,

    timeout_seconds INTEGER NOT NULL DEFAULT 300,

    renewal_count INTEGER NOT NULL DEFAULT 0,

    conflict_count INTEGER NOT NULL DEFAULT 0,

    release_reason TEXT,

    status TEXT NOT NULL DEFAULT 'active',

    metadata TEXT,

    is_expired INTEGER NOT NULL DEFAULT 0,

    is_released INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id)
        REFERENCES movie_ai_agents(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (workflow_id)
        REFERENCES movie_ai_workflows(id)
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

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_uuid
ON movie_ai_locks(lock_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_key
ON movie_ai_locks(lock_key);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_resource_type
ON movie_ai_locks(resource_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_resource_id
ON movie_ai_locks(resource_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_owner_type
ON movie_ai_locks(owner_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_owner_id
ON movie_ai_locks(owner_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_agent
ON movie_ai_locks(agent_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_workflow
ON movie_ai_locks(workflow_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_scheduler
ON movie_ai_locks(scheduler_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_queue
ON movie_ai_locks(queue_job_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_status
ON movie_ai_locks(status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_priority
ON movie_ai_locks(priority);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_expires
ON movie_ai_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_heartbeat
ON movie_ai_locks(last_heartbeat_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_expired
ON movie_ai_locks(is_expired);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_released
ON movie_ai_locks(is_released);

CREATE INDEX IF NOT EXISTS idx_movie_ai_locks_created
ON movie_ai_locks(created_at);

COMMIT;