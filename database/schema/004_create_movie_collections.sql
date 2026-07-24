-- ======================================================
-- Library Of Legends 2.0
-- File: 004_movie_collections.sql
-- Module: Database Schema
-- Table: movie_collections
-- Description: Creates the relationship between movies and collections
-- Author: Thomas Lorenz
-- Version: 2.0
-- ======================================================

-- ======================================================
-- TABLE
-- ======================================================

CREATE TABLE IF NOT EXISTS movie_collections (

    movie_id BIGINT NOT NULL,

    collection_id BIGINT NOT NULL,

    position INTEGER,

    PRIMARY KEY (movie_id, collection_id),

    CONSTRAINT fk_movie_collections_movies
        FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_movie_collections_collections
        FOREIGN KEY (collection_id)
        REFERENCES collections(id)
        ON DELETE CASCADE

);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_movie_collections_movie_id
ON movie_collections(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_collection_id
ON movie_collections(collection_id);

CREATE INDEX IF NOT EXISTS idx_movie_collections_position
ON movie_collections(position);

-- ======================================================
-- FOREIGN KEYS
-- ======================================================

-- fk_movie_collections_movies
-- movie_id → movies.id

-- fk_movie_collections_collections
-- collection_id → collections.id

-- ======================================================
-- TRIGGERS
-- ======================================================

-- None

-- ======================================================
-- VIEWS
-- ======================================================

-- None

-- ======================================================
-- DEFAULT DATA
-- ======================================================

-- None