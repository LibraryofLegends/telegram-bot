/*
================================================================
Library Of Legends 2.0
Migration: 000053_create_movie_ai_recommendations.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für KI-gestützte
Filmempfehlungen.

Diese Tabelle speichert automatisch erzeugte
Empfehlungen auf Basis verschiedener KI-Modelle,
Benutzerinteraktionen und semantischer Analysen.

Unterstützte Empfehlungstypen:
- Ähnliche Filme
- Personalisierte Empfehlungen
- Genre-Empfehlungen
- Franchise-Empfehlungen
- Sammlungen
- Schauspieler
- Regisseure
- Embedding-Ähnlichkeiten
- Benutzerverhalten
- KI-generierte Vorschläge

Erstellt:
- movie_ai_recommendations

Abhängigkeiten:
- 000002_create_movies.sql
- 000051_create_movie_ai_analysis.sql
- 000052_create_movie_ai_embeddings.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_recommendations
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    source_movie_id INTEGER NOT NULL,

    recommended_movie_id INTEGER NOT NULL,

    analysis_id INTEGER,

    embedding_id INTEGER,

    recommendation_provider TEXT NOT NULL,

    recommendation_model TEXT,

    recommendation_type TEXT NOT NULL,

    recommendation_reason TEXT,

    similarity_score REAL NOT NULL DEFAULT 0,

    confidence_score REAL NOT NULL DEFAULT 0,

    embedding_similarity REAL,

    genre_similarity REAL,

    keyword_similarity REAL,

    cast_similarity REAL,

    director_similarity REAL,

    collection_similarity REAL,

    franchise_similarity REAL,

    user_behavior_score REAL,

    popularity_score REAL,

    diversity_score REAL,

    novelty_score REAL,

    ranking_position INTEGER,

    explanation TEXT,

    metadata TEXT,

    generated_at DATETIME,

    expires_at DATETIME,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE
    (
        source_movie_id,
        recommended_movie_id,
        recommendation_type
    ),

    FOREIGN KEY (source_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (recommended_movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (analysis_id)
        REFERENCES movie_ai_analysis(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (embedding_id)
        REFERENCES movie_ai_embeddings(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_source
ON movie_ai_recommendations(source_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_recommended
ON movie_ai_recommendations(recommended_movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_analysis
ON movie_ai_recommendations(analysis_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_embedding
ON movie_ai_recommendations(embedding_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_provider
ON movie_ai_recommendations(recommendation_provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_model
ON movie_ai_recommendations(recommendation_model);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_type
ON movie_ai_recommendations(recommendation_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_similarity
ON movie_ai_recommendations(similarity_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_confidence
ON movie_ai_recommendations(confidence_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_ranking
ON movie_ai_recommendations(ranking_position);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_generated
ON movie_ai_recommendations(generated_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_recommendations_active
ON movie_ai_recommendations(is_active);

COMMIT;