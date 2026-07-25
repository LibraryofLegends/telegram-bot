/*
================================================================
Library Of Legends 2.0
Migration: 000034_create_movie_keywords.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für Keywords eines Films.

Im Gegensatz zu Tags dienen Keywords der präzisen
Verschlagwortung eines Films und orientieren sich an
internationalen Datenbanken wie TMDb.

Beispiele:
- time travel
- artificial intelligence
- spaceship
- serial killer
- dystopia
- vampire
- zombie
- friendship
- revenge
- post apocalypse

Ein Film kann beliebig viele Keywords besitzen.

Erstellt:
- movie_keywords

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_keywords
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    keyword TEXT NOT NULL,

    normalized_keyword TEXT NOT NULL,

    language TEXT,

    source TEXT,

    external_id TEXT,

    relevance_score REAL DEFAULT 1.0,

    usage_count INTEGER NOT NULL DEFAULT 0,

    is_primary INTEGER NOT NULL DEFAULT 0,

    is_generated INTEGER NOT NULL DEFAULT 0,

    is_verified INTEGER NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        movie_id,
        normalized_keyword
    ),

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_movie
ON movie_keywords(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_keyword
ON movie_keywords(keyword);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_normalized
ON movie_keywords(normalized_keyword);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_language
ON movie_keywords(language);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_source
ON movie_keywords(source);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_external
ON movie_keywords(external_id);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_relevance
ON movie_keywords(relevance_score);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_usage
ON movie_keywords(usage_count);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_primary
ON movie_keywords(is_primary);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_generated
ON movie_keywords(is_generated);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_verified
ON movie_keywords(is_verified);

CREATE INDEX IF NOT EXISTS idx_movie_keywords_sort
ON movie_keywords(sort_order);

COMMIT;