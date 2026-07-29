/*
================================================================
Library Of Legends 2.0
Migration: 000085_create_movie_ai_audit_log_hashes.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die kryptographische Integritäts-
und Verkettungsebene für das Audit-System.

Diese Tabelle speichert für jeden Audit-
Eintrag einen kryptographischen Hash sowie
eine Hash-Chain mit Referenz auf den
vorherigen Eintrag. Dadurch können
Manipulationen revisionssicher erkannt
werden.

Unterstützte Funktionen:
- SHA-Hash Speicherung
- Hash-Chain
- Digitale Signaturen
- Integritätsprüfung
- Verifizierungsstatus
- Audit-Nachweis
- Revisionssicherheit

Erstellt:
- movie_ai_audit_log_hashes

Abhängigkeiten:
- 000084_create_movie_ai_audit_logs.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_audit_log_hashes
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    hash_uuid TEXT NOT NULL UNIQUE,

    audit_log_id INTEGER NOT NULL,

    audit_uuid TEXT NOT NULL,

    chain_position INTEGER NOT NULL,

    algorithm TEXT NOT NULL DEFAULT 'SHA-256',

    current_hash TEXT NOT NULL,

    previous_hash TEXT,

    next_hash TEXT,

    root_hash TEXT,

    signature_algorithm TEXT,

    digital_signature TEXT,

    public_key_fingerprint TEXT,

    checksum TEXT,

    verification_status TEXT NOT NULL DEFAULT 'pending',

    verification_message TEXT,

    verified_by TEXT,

    verified_at DATETIME,

    integrity_status TEXT NOT NULL DEFAULT 'valid',

    tamper_detected INTEGER NOT NULL DEFAULT 0,

    repair_attempts INTEGER NOT NULL DEFAULT 0,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (audit_log_id)
        REFERENCES movie_ai_audit_logs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_audit
ON movie_ai_audit_log_hashes(audit_log_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_uuid
ON movie_ai_audit_log_hashes(hash_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_audit_uuid
ON movie_ai_audit_log_hashes(audit_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_chain
ON movie_ai_audit_log_hashes(chain_position);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_algorithm
ON movie_ai_audit_log_hashes(algorithm);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_status
ON movie_ai_audit_log_hashes(verification_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_integrity
ON movie_ai_audit_log_hashes(integrity_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_verified
ON movie_ai_audit_log_hashes(verified_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_tamper
ON movie_ai_audit_log_hashes(tamper_detected);

CREATE INDEX IF NOT EXISTS idx_movie_ai_audit_log_hashes_created
ON movie_ai_audit_log_hashes(created_at);

COMMIT;