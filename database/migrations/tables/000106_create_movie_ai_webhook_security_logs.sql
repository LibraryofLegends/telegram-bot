/*
================================================================
Library Of Legends 2.0
Migration: 000106_create_movie_ai_webhook_security_logs.sql
----------------------------------------------------------------
Beschreibung:
Erstellt das zentrale Sicherheitsprotokoll
für das Webhook-System.

Diese Tabelle dokumentiert sämtliche
sicherheitsrelevanten Ereignisse rund um
Webhook-Kommunikation, Authentifizierung,
Signaturprüfung, Replay-Erkennung,
Rate-Limits sowie Angriffsversuche.

Unterstützte Funktionen:
- Security Logging
- Signaturfehler
- Replay Detection
- Authentifizierungsfehler
- Rate-Limit Verstöße
- IP-Blockierung
- Angriffserkennung
- Incident Response
- Audit
- Forensik

Erstellt:
- movie_ai_webhook_security_logs

Abhängigkeiten:
- 000098_create_movie_ai_webhooks.sql
- 000105_create_movie_ai_webhook_signatures.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_webhook_security_logs
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    security_log_uuid TEXT NOT NULL UNIQUE,

    webhook_id INTEGER,

    signature_id INTEGER,

    event_type TEXT NOT NULL,

    severity TEXT NOT NULL DEFAULT 'medium',

    attack_type TEXT,

    detection_method TEXT,

    security_status TEXT NOT NULL DEFAULT 'detected',

    source_ip TEXT,

    destination_ip TEXT,

    user_agent TEXT,

    request_method TEXT,

    request_url TEXT,

    request_headers TEXT,

    request_body TEXT,

    signature_algorithm TEXT,

    signature_valid INTEGER NOT NULL DEFAULT 1,

    authentication_result TEXT,

    replay_detected INTEGER NOT NULL DEFAULT 0,

    rate_limit_exceeded INTEGER NOT NULL DEFAULT 0,

    ip_blocked INTEGER NOT NULL DEFAULT 0,

    firewall_action TEXT,

    response_action TEXT,

    incident_reference TEXT,

    correlation_id TEXT,

    request_id TEXT,

    error_code TEXT,

    error_message TEXT,

    forensic_data TEXT,

    metadata TEXT,

    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    resolved_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (webhook_id)
        REFERENCES movie_ai_webhooks(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (signature_id)
        REFERENCES movie_ai_webhook_signatures(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_uuid
ON movie_ai_webhook_security_logs(security_log_uuid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_webhook
ON movie_ai_webhook_security_logs(webhook_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_signature
ON movie_ai_webhook_security_logs(signature_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_event
ON movie_ai_webhook_security_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_severity
ON movie_ai_webhook_security_logs(severity);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_attack
ON movie_ai_webhook_security_logs(attack_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_status
ON movie_ai_webhook_security_logs(security_status);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_source_ip
ON movie_ai_webhook_security_logs(source_ip);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_signature_valid
ON movie_ai_webhook_security_logs(signature_valid);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_replay
ON movie_ai_webhook_security_logs(replay_detected);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_rate_limit
ON movie_ai_webhook_security_logs(rate_limit_exceeded);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_ip_blocked
ON movie_ai_webhook_security_logs(ip_blocked);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_correlation
ON movie_ai_webhook_security_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_request
ON movie_ai_webhook_security_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_detected
ON movie_ai_webhook_security_logs(detected_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_resolved
ON movie_ai_webhook_security_logs(resolved_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_webhook_security_logs_created
ON movie_ai_webhook_security_logs(created_at);

COMMIT;