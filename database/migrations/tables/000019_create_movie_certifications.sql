/*
================================================================
Library Of Legends 2.0
Migration: 000019_create_movie_certifications.sql
----------------------------------------------------------------
Beschreibung:
Verknüpft Filme mit Altersfreigaben.

Ein Film kann mehrere Altersfreigaben besitzen,
beispielsweise für verschiedene Länder oder
Bewertungssysteme.

Beispiele:
- Deutschland → FSK 12
- USA → PG-13
- Großbritannien → BBFC 12A
- Australien → M
- Japan → G

Erstellt:
- movie_certifications

Abhängigkeiten:
- 000002_create_movies.sql
- 000018_create_certifications.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_certifications
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    certification_id INTEGER NOT NULL,

    country_code TEXT NOT NULL,

    release_date DATE,

    notes TEXT,

    is_primary INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        certification_id,
        country_code
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (certification_id)
        REFERENCES certifications(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_certifications_movie
ON movie_certifications(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_certifications_certification
ON movie_certifications(certification_id);

CREATE INDEX IF NOT EXISTS idx_movie_certifications_country
ON movie_certifications(country_code);

CREATE INDEX IF NOT EXISTS idx_movie_certifications_release_date
ON movie_certifications(release_date);

CREATE INDEX IF NOT EXISTS idx_movie_certifications_primary
ON movie_certifications(is_primary);

COMMIT;