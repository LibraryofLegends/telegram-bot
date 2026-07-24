-- ======================================================
-- Library Of Legends 2.0
-- Movies Table
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

    CONSTRAINT fk_movie_media
        FOREIGN KEY (media_item_id)
        REFERENCES media_items(id)
        ON DELETE CASCADE

);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id
ON movies(tmdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_imdb_id
ON movies(imdb_id);

CREATE INDEX IF NOT EXISTS idx_movies_media_item_id
ON movies(media_item_id);