/*
================================================================
Library Of Legends 2.0
Migration: 000022_create_countries.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Länder-Tabelle.

Diese Tabelle dient als Referenz für sämtliche Länder
innerhalb des Systems.

Verwendung:
- Produktionsländer
- Erscheinungsländer
- Herkunftsländer
- Geburtsländer
- Firmensitze
- Sprachzuordnungen
- Regionale Veröffentlichungen

Erstellt:
- countries

Abhängigkeiten:
- Keine

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS countries
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    iso_3166_1_alpha2 TEXT NOT NULL UNIQUE,

    iso_3166_1_alpha3 TEXT UNIQUE,

    iso_numeric INTEGER UNIQUE,

    name_de TEXT NOT NULL,

    name_en TEXT NOT NULL,

    native_name TEXT,

    official_name TEXT,

    continent TEXT,

    region TEXT,

    subregion TEXT,

    flag_emoji TEXT,

    flag_svg TEXT,

    flag_png TEXT,

    tld TEXT,

    currency_code TEXT,

    currency_name TEXT,

    phone_prefix TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_countries_alpha2
ON countries(iso_3166_1_alpha2);

CREATE INDEX IF NOT EXISTS idx_countries_alpha3
ON countries(iso_3166_1_alpha3);

CREATE INDEX IF NOT EXISTS idx_countries_numeric
ON countries(iso_numeric);

CREATE INDEX IF NOT EXISTS idx_countries_name_de
ON countries(name_de);

CREATE INDEX IF NOT EXISTS idx_countries_name_en
ON countries(name_en);

CREATE INDEX IF NOT EXISTS idx_countries_continent
ON countries(continent);

CREATE INDEX IF NOT EXISTS idx_countries_region
ON countries(region);

CREATE INDEX IF NOT EXISTS idx_countries_active
ON countries(is_active);

COMMIT;