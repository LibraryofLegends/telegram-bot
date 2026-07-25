/*
================================================================
Library Of Legends 2.0
Migration: 000044_create_movie_import_logs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Import-Protokolle.

Diese Tabelle dokumentiert sämtliche Importvorgänge
der Medienbibliothek und dient der Analyse,
Fehlerdiagnose sowie der Nachvollziehbarkeit.

Erfasste Importquellen:
- Telegram Userbot
- Telegram Bot
- TMDb
- IMDb
- OMDb
- Lokale Dateien
- Manuelle Eingabe
- API-Importe
- CSV/XML/JSON-Importe

Erstellt:
- movie_import_logs

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_import_logs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER,

    import_session_uuid TEXT NOT NULL,

    import_source TEXT NOT NULL,

    source_identifier TEXT,

    source_url TEXT,

    import_type TEXT NOT NULL,

    import_status TEXT NOT NULL,

    started_at DATETIME NOT NULL,

    finished_at DATETIME,

    duration_ms INTEGER,

    imported_records INTEGER NOT NULL DEFAULT 0,

    updated_records INTEGER NOT NULL DEFAULT 0,

    skipped_records INTEGER NOT NULL DEFAULT 0,

    failed_records INTEGER NOT NULL DEFAULT 0,

    warning_count INTEGER NOT NULL DEFAULT 0,

    error_count INTEGER NOT NULL DEFAULT 0,

    checksum TEXT,

    imported_by TEXT,

    application_version TEXT,

    log_level TEXT DEFAULT 'INFO',

    warning_message TEXT,

    error_message TEXT,

    stack_trace TEXT,

    raw_payload TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_movie
ON movie_import_logs(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_session
ON movie_import_logs(import_session_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_source
ON movie_import_logs(import_source);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_type
ON movie_import_logs(import_type);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_status
ON movie_import_logs(import_status);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_started
ON movie_import_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_finished
ON movie_import_logs(finished_at);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_duration
ON movie_import_logs(duration_ms);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_imported_by
ON movie_import_logs(imported_by);

CREATE INDEX IF NOT EXISTS idx_movie_import_logs_checksum
ON movie_import_logs(checksum);

COMMIT;