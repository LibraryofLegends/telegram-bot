/*
================================================================
Library Of Legends 2.0
Migration: 000039_create_movie_collections_extended.sql
----------------------------------------------------------------
Beschreibung:
Erweitert das Collection- und Franchise-System um
zusätzliche Metadaten.

Diese Tabelle dient zur Abbildung komplexer
Filmreihen, Universen und Zeitachsen.

Unterstützte Informationen:
- Universum
- Phase
- Saga
- Story Arc
- Zeitachse
- Kanon
- Reboot
- Soft Reboot
- Spin-Off
- Prequel
- Sequel
- Midquel
- Crossover
- Multiversum
- Empfohlene Reihenfolge

Erstellt:
- movie_collections_extended

Abhängigkeiten:
- 000002_create_movies.sql
- 000005_create_collections.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_collections_extended
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    collection_id INTEGER NOT NULL,

    universe_name TEXT,

    timeline_name TEXT,

    saga_name TEXT,

    story_arc TEXT,

    phase_name TEXT,

    chapter_name TEXT,

    canon_status TEXT,

    reboot_cycle TEXT,

    continuity TEXT,

    media_role TEXT,

    chronological_order INTEGER,

    release_order INTEGER,

    recommended_order INTEGER,

    viewing_order INTEGER,

    multiverse_identifier TEXT,

    notes TEXT,

    is_canon INTEGER NOT NULL DEFAULT 1,

    is_reboot INTEGER NOT NULL DEFAULT 0,

    is_spin_off INTEGER NOT NULL DEFAULT 0,

    is_prequel INTEGER NOT NULL DEFAULT 0,

    is_sequel INTEGER NOT NULL DEFAULT 0,

    is_midquel INTEGER NOT NULL DEFAULT 0,

    is_crossover INTEGER NOT NULL DEFAULT 0,

    is_multiverse INTEGER NOT NULL DEFAULT 0,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        collection_id
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (collection_id)
        REFERENCES collections(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_movie
ON movie_collections_extended(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_collection
ON movie_collections_extended(collection_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_universe
ON movie_collections_extended(universe_name);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_timeline
ON movie_collections_extended(timeline_name);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_saga
ON movie_collections_extended(saga_name);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_phase
ON movie_collections_extended(phase_name);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_story_arc
ON movie_collections_extended(story_arc);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_canon
ON movie_collections_extended(is_canon);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_reboot
ON movie_collections_extended(is_reboot);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_spinoff
ON movie_collections_extended(is_spin_off);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_prequel
ON movie_collections_extended(is_prequel);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_sequel
ON movie_collections_extended(is_sequel);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_midquel
ON movie_collections_extended(is_midquel);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_crossover
ON movie_collections_extended(is_crossover);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_multiverse
ON movie_collections_extended(is_multiverse);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_release_order
ON movie_collections_extended(release_order);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_chronological_order
ON movie_collections_extended(chronological_order);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_viewing_order
ON movie_collections_extended(viewing_order);

CREATE INDEX IF NOT EXISTS idx_movie_collections_extended_active
ON movie_collections_extended(is_active);

COMMIT;