/*
================================================================
Library Of Legends 2.0
Migration: 000052_create_movie_ai_embeddings.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Embedding-Tabelle für
KI-gestützte semantische Suche.

Diese Tabelle speichert Vektor-Embeddings für
Filme und verwandte Inhalte.

Unterstützte Inhalte:
- Filme
- Beschreibungen
- Zusammenfassungen
- Schlagwörter
- Genres
- Personen
- Sammlungen
- Franchises
- Zitate
- Trivia
- Benutzerinhalte

Die Embeddings dienen als Grundlage für:
- Semantische Suche
- Ähnlichkeitssuche
- KI-Empfehlungen
- RAG-Systeme
- Automatische Kategorisierung

Erstellt:
- movie_ai_embeddings

Abhängigkeiten:
- 000002_create_movies.sql
- 000051_create_movie_ai_analysis.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_embeddings
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    analysis_id INTEGER,

    embedding_provider TEXT NOT NULL,

    embedding_model TEXT NOT NULL,

    embedding_version TEXT,

    embedding_type TEXT NOT NULL,

    source_type TEXT NOT NULL,

    source_field TEXT,

    source_language TEXT,

    source_hash TEXT,

    vector_dimensions INTEGER NOT NULL,

    vector_data TEXT NOT NULL,

    vector_checksum TEXT,

    similarity_algorithm TEXT,

    normalization_method TEXT,

    distance_metric TEXT,

    token_count INTEGER,

    processing_time_ms INTEGER,

    confidence_score REAL,

    is_active INTEGER NOT NULL DEFAULT 1,

    metadata TEXT,

    generated_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (analysis_id)
        REFERENCES movie_ai_analysis(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_movie
ON movie_ai_embeddings(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_analysis
ON movie_ai_embeddings(analysis_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_provider
ON movie_ai_embeddings(embedding_provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_model
ON movie_ai_embeddings(embedding_model);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_type
ON movie_ai_embeddings(embedding_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_source_type
ON movie_ai_embeddings(source_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_source_field
ON movie_ai_embeddings(source_field);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_language
ON movie_ai_embeddings(source_language);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_dimensions
ON movie_ai_embeddings(vector_dimensions);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_checksum
ON movie_ai_embeddings(vector_checksum);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_active
ON movie_ai_embeddings(is_active);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_generated
ON movie_ai_embeddings(generated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_embeddings_created
ON movie_ai_embeddings(created_at);

COMMIT;