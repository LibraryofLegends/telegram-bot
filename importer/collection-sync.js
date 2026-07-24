async function syncMovieCollection(
    pgPool,
    tmdbData,
    libraryMovie,
    findOrCreateCollection,
    assignMovieToCollection
) {
    if (!pgPool) {
        return null;
    }

    if (!tmdbData?.collection) {
        return null;
    }

    if (!libraryMovie) {
        return null;
    }

    const collection = await findOrCreateCollection(
        pgPool,
        tmdbData.collection
    );

    if (!collection) {
        return null;
    }

    await assignMovieToCollection(
        pgPool,
        libraryMovie.id,
        collection.id
    );

    return collection;
}

module.exports = {
    syncMovieCollection,
};