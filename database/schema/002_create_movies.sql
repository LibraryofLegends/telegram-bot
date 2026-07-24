-- ======================================================
-- Library Of Legends 2.0
-- File: 002_movies.sql
-- Module: Database Schema
-- Table: movies
-- Description: Creates the movies table
-- Author: Thomas Lorenz
-- Version: 2.0
-- ======================================================

-- ======================================================
-- TABLE
-- ======================================================

CREATE TABLE IF NOT EXISTS movies (

    id BIGSERIAL PRIMARY KEY,

    media_item_id BIGINT NOT NULL UNIQUE,

    tmdb_id INTEGER UNIQUE,

    imdb_id VARCHAR(20),

    runtime INTEGER,

    budget BIGINT,

    revenue BIGINT,

    tagline TEXT,

    video_quality VARCHAR(30),

    audio_quality VARCHAR(30),

    resolution VARCHAR(30),

    hdr VARCHAR(30),

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_movies_media_items
        FOREIGN KEY (media_item_id)
        REFERENCES media_items(id)
        ON DELETE CASCADE

);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_movies_media_item_id
ON movies(media_item_id);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id
ON movies(tmdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_imdb_id
ON movies(imdb_id);

-- ======================================================
-- FOREIGN KEYS
-- ======================================================

-- fk_movies_media_items
-- media_item_id → media_items.id

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