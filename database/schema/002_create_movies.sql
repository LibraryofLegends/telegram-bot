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
        FOREIGN KEY(media_item_id)
        REFERENCES media_items(id)
        ON DELETE CASCADE

);