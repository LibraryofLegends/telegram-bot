CREATE TABLE IF NOT EXISTS movie_collections (

    movie_id BIGINT NOT NULL,

    collection_id BIGINT NOT NULL,

    position INTEGER,

    PRIMARY KEY(movie_id, collection_id),

    CONSTRAINT fk_movie
        FOREIGN KEY(movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_collection
        FOREIGN KEY(collection_id)
        REFERENCES collections(id)
        ON DELETE CASCADE

);