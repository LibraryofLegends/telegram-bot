/*
================================================================
Library Of Legends 2.0
Migration: 000029_create_movie_awards.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Auszeichnungen und
Nominierungen von Filmen.

Unterstützte Preisverleihungen:
- Academy Awards (Oscar)
- Golden Globe Awards
- BAFTA Awards
- Emmy Awards
- Saturn Awards
- Cannes Film Festival
- Berlinale
- César Awards
- Deutscher Filmpreis
- Weitere nationale und internationale Auszeichnungen

Ein Film kann beliebig viele Auszeichnungen und
Nominierungen besitzen.

Erstellt:
- movie_awards

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_awards
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    award_name TEXT NOT NULL,

    organization TEXT,

    category TEXT NOT NULL,

    award_year INTEGER NOT NULL,

    result TEXT NOT NULL,

    recipient_type TEXT,

    recipient_name TEXT,

    source TEXT,

    notes TEXT,

    ceremony_number INTEGER,

    is_major_award INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_awards_movie
ON movie_awards(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_awards_name
ON movie_awards(award_name);

CREATE INDEX IF NOT EXISTS idx_movie_awards_category
ON movie_awards(category);

CREATE INDEX IF NOT EXISTS idx_movie_awards_year
ON movie_awards(award_year);

CREATE INDEX IF NOT EXISTS idx_movie_awards_result
ON movie_awards(result);

CREATE INDEX IF NOT EXISTS idx_movie_awards_recipient_type
ON movie_awards(recipient_type);

CREATE INDEX IF NOT EXISTS idx_movie_awards_source
ON movie_awards(source);

CREATE INDEX IF NOT EXISTS idx_movie_awards_major
ON movie_awards(is_major_award);

CREATE INDEX IF NOT EXISTS idx_movie_awards_active
ON movie_awards(is_active);

COMMIT;