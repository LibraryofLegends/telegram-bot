async function updateMovieStaging(
    pgPool,
    parsed,
    libraryMovie,
    stagingMessageId
) {
    if (
        parsed.type !== "movie" ||
        !libraryMovie
    ) {
        return;
    }

    await pgPool.query(
        `
        UPDATE movies
        SET
            staging_message_id=$1,
            updated_at=NOW()
        WHERE id=$2
        `,
        [
            stagingMessageId,
            libraryMovie.id,
        ]
    );
}

module.exports = {
    updateMovieStaging,
};