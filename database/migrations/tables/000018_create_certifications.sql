/*
================================================================
Library Of Legends 2.0
Migration: 000018_create_certifications.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Altersfreigaben.

Diese Tabelle dient als Referenz für nationale und
internationale Altersfreigaben und Jugendschutz-
Kennzeichnungen.

Beispiele:
- FSK
- USK
- MPAA
- BBFC
- PEGI
- ESRB
- CERO
- OFLC

Erstellt:
- certifications

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS certifications
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    system TEXT NOT NULL,

    country_code TEXT NOT NULL,

    code TEXT NOT NULL,

    minimum_age INTEGER,

    description TEXT,

    icon_path TEXT,

    color TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        system,
        country_code,
        code
    )
);

CREATE INDEX IF NOT EXISTS idx_certifications_system
ON certifications(system);

CREATE INDEX IF NOT EXISTS idx_certifications_country
ON certifications(country_code);

CREATE INDEX IF NOT EXISTS idx_certifications_code
ON certifications(code);

CREATE INDEX IF NOT EXISTS idx_certifications_age
ON certifications(minimum_age);

CREATE INDEX IF NOT EXISTS idx_certifications_sort_order
ON certifications(sort_order);

CREATE INDEX IF NOT EXISTS idx_certifications_active
ON certifications(is_active);

COMMIT;