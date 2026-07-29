/*
================================================================
Library Of Legends 2.0
Migration: 000097_create_movie_ai_api_key_rotations.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Historie sämtlicher API-Key-
Rotationen innerhalb von Library Of Legends.

Diese Tabelle dokumentiert jede Erneuerung,
Ersetzung, Sperrung oder Außerkraftsetzung
eines API-Schlüssels einschließlich
Validierung, Rollback und Auditdaten.

Unterstützte Funktionen:
- API-Key-Rotation
- Key-Ersetzung
- Automatische Rotation
- Manuelle Rotation
- Rollback
- Validierung
- Audit-Unterstützung
- Sicherheitsprotokollierung

Erstellt:
- movie_ai_api_key_rotations

Abhängigkeiten:
- 000095_create_movie_ai_api_keys.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_api_key_rotations
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    rotation_uuid TEXT NOT NULL UNIQUE,

    old_api_key_id INTEGER NOT NULL,

    new_api_key_id INTEGER,

    rotation_type TEXT NOT NULL,

    rotation_trigger TEXT NOT NULL,

    rotation_reason TEXT,

    initiated_by TEXT,

    approved_by TEXT,

    validation_status TEXT NOT NULL DEFAULT 'pending',

    validation_message TEXT,

    rollback_available INTEGER NOT NULL DEFAULT 0,

    rollback_performed INTEGER NOT NULL DEFAULT 0,

    rollback_reason TEXT,

    rollback_at DATETIME,

    previous_key_fingerprint TEXT,

    new_key_fingerprint TEXT,

    previous_key_version TEXT,

    new_key_version TEXT,

    previous_expiration DATETIME,

    new_expiration DATETIME,

    downtime_ms INTEGER,

    affected_services TEXT,

    affected_providers TEXT,

    affected_agents TEXT,

    security_incident_id TEXT,

    audit_reference TEXT,

    metadata TEXT,

    rotated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (old_api_key_id)
        REFERENCES movie_ai_api_keys(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (new_api_key_id)
        REFERENCES movie_ai_api_keys(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_uuid
ON movie_ai_api_key_rotations(rotation_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_old_key
ON movie_ai_api_key_rotations(old_api_key_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_new_key
ON movie_ai_api_key_rotations(new_api_key_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_type
ON movie_ai_api_key_rotations(rotation_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_trigger
ON movie_ai_api_key_rotations(rotation_trigger);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_validation
ON movie_ai_api_key_rotations(validation_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_initiated
ON movie_ai_api_key_rotations(initiated_by);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_approved
ON movie_ai_api_key_rotations(approved_by);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_rollback
ON movie_ai_api_key_rotations(rollback_performed);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_rotated
ON movie_ai_api_key_rotations(rotated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_completed
ON movie_ai_api_key_rotations(completed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_api_key_rotations_created
ON movie_ai_api_key_rotations(created_at);

COMMIT;