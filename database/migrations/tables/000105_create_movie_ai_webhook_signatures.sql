/*
================================================================
Library Of Legends 2.0
Migration: 000105_create_movie_ai_webhook_signatures.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Verwaltung
kryptografischer Webhook-Signaturen.

Diese Tabelle verwaltet Signaturalgorithmen,
Secrets, öffentliche Schlüssel,
Schlüsselversionen, Rotationen,
Hashverfahren sowie sämtliche
Verifikationsinformationen.

Unterstützte Funktionen:
- Webhook-Signaturen
- Secret Management
- Public Keys
- Key Rotation
- Signaturprüfung
- Hash-Verfahren
- Gültigkeitsprüfung
- Sicherheitsrichtlinien
- Audit
- Metadaten

Erstellt:
- movie_ai_webhook_signatures

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_signatures
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    signature_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER NOT NULL,

    signature_name TEXT NOT NULL,

    signature_version TEXT NOT NULL,

    signature_algorithm TEXT NOT NULL,

    hash_algorithm TEXT NOT NULL,

    key_type TEXT NOT NULL,

    key_identifier TEXT,

    key_version TEXT,

    secret_value TEXT,

    public_key TEXT,

    private_key_reference TEXT,

    certificate_reference TEXT,

    signature_header TEXT NOT NULL,

    timestamp_header TEXT,

    nonce_header TEXT,

    verification_mode TEXT NOT NULL DEFAULT 'strict',

    verification_window_seconds INTEGER NOT NULL DEFAULT 300,

    rotation_interval_days INTEGER,

    last_rotated_at DATETIME,

    next_rotation_at DATETIME,

    valid_from DATETIME,

    valid_until DATETIME,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    is_revoked INTEGER NOT NULL DEFAULT 0,

    revoked_at DATETIME,

    revoked_reason TEXT,

    created_by TEXT,

    updated_by TEXT,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_uuid
ON movie_ai_webhook_signatures(signature_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_webhook
ON movie_ai_webhook_signatures(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_name
ON movie_ai_webhook_signatures(signature_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_version
ON movie_ai_webhook_signatures(signature_version);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_algorithm
ON movie_ai_webhook_signatures(signature_algorithm);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_hash
ON movie_ai_webhook_signatures(hash_algorithm);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_key_type
ON movie_ai_webhook_signatures(key_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_primary
ON movie_ai_webhook_signatures(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_active
ON movie_ai_webhook_signatures(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_revoked
ON movie_ai_webhook_signatures(is_revoked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_rotation
ON movie_ai_webhook_signatures(next_rotation_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_valid_from
ON movie_ai_webhook_signatures(valid_from);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_valid_until
ON movie_ai_webhook_signatures(valid_until);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_created
ON movie_ai_webhook_signatures(created_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_signatures_updated
ON movie_ai_webhook_signatures(updated_at);

COMMIT;