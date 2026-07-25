/*
================================================================
Library Of Legends 2.0
Migration: 000009_create_movie_crew.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die Crew-Tabelle für Filme.

Diese Tabelle verknüpft Filme mit Personen und speichert
deren Funktion hinter der Kamera.

Beispiele:
- Regisseur
- Drehbuchautor
- Produzent
- Executive Producer
- Kameramann
- Cutter
- Komponist
- Kostümdesigner
- Produktionsdesigner
- Visual Effects Supervisor

Erstellt:
- movie_crew

Abhängigkeiten:
- 000002_create_movies.sql
- 000007_create_people.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_crew
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    movie_id INTEGER NOT NULL,

    person_id INTEGER NOT NULL,

    department TEXT NOT NULL,

    job TEXT NOT NULL,

    credit_name TEXT,

    crew_order INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        person_id,
        department,
        job
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (person_id)
        REFERENCES people(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_crew_movie
ON movie_crew(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_crew_person
ON movie_crew(person_id);

CREATE INDEX IF NOT EXISTS idx_movie_crew_department
ON movie_crew(department);

CREATE INDEX IF NOT EXISTS idx_movie_crew_job
ON movie_crew(job);

CREATE INDEX IF NOT EXISTS idx_movie_crew_credit_name
ON movie_crew(credit_name);

CREATE INDEX IF NOT EXISTS idx_movie_crew_order
ON movie_crew(crew_order);

COMMIT;