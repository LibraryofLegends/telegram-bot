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