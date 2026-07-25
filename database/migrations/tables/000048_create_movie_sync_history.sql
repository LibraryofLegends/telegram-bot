/*
================================================================
Library Of Legends 2.0
Migration: 000048_create_movie_sync_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historien-Tabelle für sämtliche
Synchronisationsvorgänge mit externen Diensten.

Diese Tabelle speichert jede Synchronisation dauerhaft
und ermöglicht eine vollständige Nachvollziehbarkeit
aller Datenübertragungen.

Erfasste Informationen:
- Synchronisationsstatus
- Anbieter
- Richtung
- Laufzeiten
- HTTP-Statuscodes
- Fehler
- Wiederholungsversuche
- Request-/Response-Daten
- Worker
- Metadaten

Erstellt:
- movie_sync_history

Abhängigkeiten:
- 000047_create_movie_sync_queue.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_sync_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    sync_queue_id INTEGER NOT NULL,

    sync_uuid TEXT NOT NULL,

    movie_id INTEGER,

    provider_name TEXT NOT NULL,

    provider_identifier TEXT,

    sync_type TEXT NOT NULL,

    sync_direction TEXT NOT NULL,

    previous_status TEXT,

    current_status TEXT NOT NULL,

    execution_number INTEGER NOT NULL DEFAULT 1,

    retry_number INTEGER NOT NULL DEFAULT 0,

    worker_name TEXT,

    started_at DATETIME,

    finished_at DATETIME,

    execution_time_ms INTEGER,

    http_status_code INTEGER,

    request_size_bytes INTEGER,

    response_size_bytes INTEGER,

    request_payload TEXT,

    response_payload TEXT,

    checksum TEXT,

    etag TEXT,

    error_message TEXT,

    stack_trace TEXT,

    correlation_id TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sync_queue_id)
        REFERENCES movie_sync_queue(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_queue
ON movie_sync_history(sync_queue_id);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_sync_uuid
ON movie_sync_history(sync_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_movie
ON movie_sync_history(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_provider
ON movie_sync_history(provider_name);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_provider_identifier
ON movie_sync_history(provider_identifier);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_type
ON movie_sync_history(sync_type);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_direction
ON movie_sync_history(sync_direction);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_status
ON movie_sync_history(current_status);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_started
ON movie_sync_history(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_finished
ON movie_sync_history(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_execution
ON movie_sync_history(execution_number);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_retry
ON movie_sync_history(retry_number);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_worker
ON movie_sync_history(worker_name);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_http_status
ON movie_sync_history(http_status_code);

CREATE INDEX IF NOT EXISTS idx_movie_sync_history_correlation
ON movie_sync_history(correlation_id);

COMMIT;