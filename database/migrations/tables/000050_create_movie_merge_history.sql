/*
================================================================
Library Of Legends 2.0
Migration: 000050_create_movie_merge_history.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historien-Tabelle für sämtliche
Zusammenführungen (Merges) von Filmdatensätzen.

Diese Tabelle dokumentiert jede Zusammenführung
dauerhaft und ermöglicht eine vollständige
Nachvollziehbarkeit aller Merge-Vorgänge.

Erfasste Informationen:
- Quellfilm
- Zielfilm
- Merge-Typ
- Zusammenführungsgrund
- Übernommene Metadaten
- Übernommene Dateien
- Übernommene Bilder
- Übernommene Bewertungen
- Konflikte
- Benutzer
- Rückgängig-Status

Erstellt:
- movie_merge_history

Abhängigkeiten:
- 000002_create_movies.sql
- 000049_create_movie_duplicates.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_merge_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    source_movie_id INTEGER NOT NULL,

    target_movie_id INTEGER NOT NULL,

    duplicate_id INTEGER,

    merge_type TEXT NOT NULL,

    merge_reason TEXT,

    merge_strategy TEXT,

    merged_metadata INTEGER NOT NULL DEFAULT 0,

    merged_files INTEGER NOT NULL DEFAULT 0,

    merged_images INTEGER NOT NULL DEFAULT 0,

    merged_trailers INTEGER NOT NULL DEFAULT 0,

    merged_ratings INTEGER NOT NULL DEFAULT 0,

    merged_tags INTEGER NOT NULL DEFAULT 0,

    merged_collections INTEGER NOT NULL DEFAULT 0,

    merged_people INTEGER NOT NULL DEFAULT 0,

    merged_translations INTEGER NOT NULL DEFAULT 0,

    conflict_count INTEGER NOT NULL DEFAULT 0,

    conflict_details TEXT,

    performed_by TEXT,

    approved_by TEXT,

    rollback_possible INTEGER NOT NULL DEFAULT 1,

    rollback_performed INTEGER NOT NULL DEFAULT 0,

    rollback_at DATETIME,

    rollback_by TEXT,

    notes TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (source_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (target_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (duplicate_id)
        REFERENCES movie_duplicates(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_source
ON movie_merge_history(source_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_target
ON movie_merge_history(target_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_duplicate
ON movie_merge_history(duplicate_id);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_type
ON movie_merge_history(merge_type);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_strategy
ON movie_merge_history(merge_strategy);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_performed_by
ON movie_merge_history(performed_by);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_approved_by
ON movie_merge_history(approved_by);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_created_at
ON movie_merge_history(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_merge_history_rollback
ON movie_merge_history(rollback_performed);

COMMIT;