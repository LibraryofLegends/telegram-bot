-- ======================================================
-- Library Of Legends 2.0
-- File: 001_media_items.sql
-- Description: Creates the media_items table
-- Version: 2.0
-- ======================================================

-- ======================================================
-- TABLE
-- ======================================================

CREATE TABLE IF NOT EXISTS media_items (

    id BIGSERIAL PRIMARY KEY,

    library_id VARCHAR(30) UNIQUE NOT NULL,

    media_type VARCHAR(30) NOT NULL,

    title TEXT NOT NULL,

    original_title TEXT,

    sort_title TEXT,

    overview TEXT,

    release_date DATE,

    release_year INTEGER,

    original_language VARCHAR(10),

    country VARCHAR(10),

    age_rating VARCHAR(10),

    user_rating NUMERIC(3,1),

    status VARCHAR(20) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_media_items_library_id
ON media_items(library_id);

CREATE INDEX IF NOT EXISTS idx_media_items_media_type
ON media_items(media_type);

CREATE INDEX IF NOT EXISTS idx_media_items_title
ON media_items(title);

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