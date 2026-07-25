/*
================================================================
Library Of Legends 2.0
Migration: 000051_create_movie_ai_analysis.sql
----------------------------------------------------------------
Beschreibung:
Erstellt die zentrale Tabelle für KI-gestützte
Analysen von Filmen.

Diese Tabelle speichert automatisch erzeugte
Analysen verschiedener KI-Systeme und bildet die
Grundlage für intelligente Suche, Empfehlungen,
Klassifizierungen und zukünftige KI-Funktionen.

Unterstützte Analysen:
- Genre-Erkennung
- Themenanalyse
- Stimmungsanalyse
- Inhaltszusammenfassung
- Schlagwörter
- Altersklassifizierung
- Gewaltanalyse
- Sprachanalyse
- Szenenerkennung
- Personen- und Objekterkennung
- Ähnlichkeitsbewertung
- Qualitätsscore

Erstellt:
- movie_ai_analysis

Abhängigkeiten:
- 000002_create_movies.sql

Version:
1.0.0
================================================================
*/

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS movie_ai_analysis
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    uuid TEXT NOT NULL UNIQUE,

    movie_id INTEGER NOT NULL,

    analysis_provider TEXT NOT NULL,

    model_name TEXT,

    model_version TEXT,

    analysis_version TEXT,

    language_code TEXT,

    summary TEXT,

    detailed_summary TEXT,

    detected_genres TEXT,

    detected_themes TEXT,

    detected_keywords TEXT,

    detected_mood TEXT,

    detected_emotions TEXT,

    detected_objects TEXT,

    detected_people TEXT,

    detected_locations TEXT,

    detected_scenes TEXT,

    detected_languages TEXT,

    age_classification TEXT,

    violence_score REAL,

    language_score REAL,

    horror_score REAL,

    romance_score REAL,

    comedy_score REAL,

    action_score REAL,

    drama_score REAL,

    family_friendly_score REAL,

    recommendation_score REAL,

    quality_score REAL,

    similarity_vector TEXT,

    embedding_provider TEXT,

    embedding_model TEXT,

    embedding_dimension INTEGER,

    embedding_hash TEXT,

    confidence_score REAL NOT NULL DEFAULT 0,

    processing_time_ms INTEGER,

    analyzed_at DATETIME,

    metadata TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_movie
ON movie_ai_analysis(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_provider
ON movie_ai_analysis(analysis_provider);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_model
ON movie_ai_analysis(model_name);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_language
ON movie_ai_analysis(language_code);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_confidence
ON movie_ai_analysis(confidence_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_quality
ON movie_ai_analysis(quality_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_recommendation
ON movie_ai_analysis(recommendation_score);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_analyzed
ON movie_ai_analysis(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_embedding
ON movie_ai_analysis(embedding_hash);

CREATE INDEX IF NOT EXISTS idx_movie_ai_analysis_created
ON movie_ai_analysis(created_at);

COMMIT;