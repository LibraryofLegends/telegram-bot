/*
================================================================
Library Of Legends 2.0
Migration: 000054_create_movie_ai_learning.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Lerndatenbank für sämtliche
KI-Modelle innerhalb von Library Of Legends.

Diese Tabelle speichert Benutzerfeedback,
Interaktionen sowie Trainingsinformationen zur
kontinuierlichen Verbesserung zukünftiger
Empfehlungs- und Analysesysteme.

Unterstützte Lernquellen:
- Empfehlungen
- Suchanfragen
- Klickverhalten
- Favoriten
- Watchlist
- Bewertungen
- Wiedergaben
- Übersprungene Inhalte
- Manuelles Feedback
- KI-Korrekturen

Erstellt:
- movie_ai_learning

Abhängigkeiten:
- 000002_create_movies.sql
- 000051_create_movie_ai_analysis.sql
- 000052_create_movie_ai_embeddings.sql
- 000053_create_movie_ai_recommendations.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_learning
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER,

    analysis_id INTEGER,

    embedding_id INTEGER,

    recommendation_id INTEGER,

    user_id TEXT,

    learning_source TEXT NOT NULL,

    interaction_type TEXT NOT NULL,

    feedback_type TEXT,

    feedback_value REAL,

    accepted INTEGER NOT NULL DEFAULT 0,

    rejected INTEGER NOT NULL DEFAULT 0,

    ignored INTEGER NOT NULL DEFAULT 0,

    clicked INTEGER NOT NULL DEFAULT 0,

    viewed INTEGER NOT NULL DEFAULT 0,

    watch_duration_seconds INTEGER,

    completion_percentage REAL,

    rating REAL,

    search_query TEXT,

    search_result_position INTEGER,

    session_id TEXT,

    device_type TEXT,

    platform TEXT,

    model_name TEXT,

    model_version TEXT,

    training_weight REAL DEFAULT 1.0,

    confidence_score REAL,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
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
        ON UPDATE CASCADE,

    FOREIGN KEY (recommendation_id)
        REFERENCES movie_ai_recommendations(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_movie
ON movie_ai_learning(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_analysis
ON movie_ai_learning(analysis_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_embedding
ON movie_ai_learning(embedding_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_recommendation
ON movie_ai_learning(recommendation_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_user
ON movie_ai_learning(user_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_source
ON movie_ai_learning(learning_source);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_interaction
ON movie_ai_learning(interaction_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_feedback
ON movie_ai_learning(feedback_type);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_session
ON movie_ai_learning(session_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_model
ON movie_ai_learning(model_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_confidence
ON movie_ai_learning(confidence_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_learning_created
ON movie_ai_learning(created_at);

COMMIT;