-- ======================================================
-- Library Of Legends 2.0
-- File: 003_collections.sql
-- Module: Database Schema
-- Table: collections
-- Description: Creates the collections table
-- Author: Thomas Lorenz
-- Version: 2.0
-- ======================================================

-- ======================================================
-- TABLE
-- ======================================================

CREATE TABLE IF NOT EXISTS collections (

    id BIGSERIAL PRIMARY KEY,

    tmdb_collection_id INTEGER UNIQUE,

    name TEXT NOT NULL,

    slug TEXT UNIQUE,

    overview TEXT,

    poster_path TEXT,

    backdrop_path TEXT,

    movie_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_collections_tmdb_collection_id
ON collections(tmdb_collection_id);

CREATE INDEX IF NOT EXISTS idx_collections_name
ON collections(name);

CREATE INDEX IF NOT EXISTS idx_collections_slug
ON collections(slug);

-- ======================================================
-- FOREIGN KEYS
-- ======================================================

-- None

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