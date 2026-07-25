/*
================================================================
Library Of Legends 2.0
Migration: 000011_create_movie_companies.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Zuordnungstabelle zwischen Filmen und
Unternehmen.

Ein Film kann mit mehreren Unternehmen verknüpft sein.
Ein Unternehmen kann an mehreren Filmen beteiligt sein.

Beispiele:
- Produktionsfirma
- Verleih
- Vertrieb
- Streaming-Anbieter
- Fernsehsender
- Animationsstudio
- Visual-Effects-Studio

Erstellt:
- movie_companies

Abhängigkeiten:
- 000002_create_movies.sql
- 000010_create_companies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_companies
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    company_id INTEGER NOT NULL,

    role TEXT NOT NULL,

    is_primary INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        company_id,
        role
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_companies_movie
ON movie_companies(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_companies_company
ON movie_companies(company_id);

CREATE INDEX IF NOT EXISTS idx_movie_companies_role
ON movie_companies(role);

CREATE INDEX IF NOT EXISTS idx_movie_companies_primary
ON movie_companies(is_primary);

COMMIT;