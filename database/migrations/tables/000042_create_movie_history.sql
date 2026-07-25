/*
================================================================
Library Of Legends 2.0
Migration: 000042_create_movie_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Historien-Tabelle für Filme.

Diese Tabelle protokolliert sämtliche Änderungen an
Filmdatensätzen und ermöglicht eine vollständige
Nachvollziehbarkeit aller Aktionen.

Erfasste Ereignisse:
- Neuer Import
- Metadaten aktualisiert
- Datei hinzugefügt
- Datei entfernt
- Bild geändert
- Trailer hinzugefügt
- Bewertung geändert
- Manuelle Bearbeitung
- Wiederherstellung
- Archivierung
- Löschung
- Sonstige Systemereignisse

Erstellt:
- movie_history

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    event_type TEXT NOT NULL,

    entity_type TEXT,

    entity_id INTEGER,

    action TEXT NOT NULL,

    previous_value TEXT,

    new_value TEXT,

    changed_fields TEXT,

    performed_by TEXT,

    source TEXT,

    ip_address TEXT,

    user_agent TEXT,

    transaction_id TEXT,

    correlation_id TEXT,

    notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_history_movie
ON movie_history(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_history_event_type
ON movie_history(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_history_entity_type
ON movie_history(entity_type);

CREATE INDEX IF NOT EXISTS idx_movie_history_entity_id
ON movie_history(entity_id);

CREATE INDEX IF NOT EXISTS idx_movie_history_action
ON movie_history(action);

CREATE INDEX IF NOT EXISTS idx_movie_history_performed_by
ON movie_history(performed_by);

CREATE INDEX IF NOT EXISTS idx_movie_history_source
ON movie_history(source);

CREATE INDEX IF NOT EXISTS idx_movie_history_transaction
ON movie_history(transaction_id);

CREATE INDEX IF NOT EXISTS idx_movie_history_correlation
ON movie_history(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_history_created_at
ON movie_history(created_at);

COMMIT;