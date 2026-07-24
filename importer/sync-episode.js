async function syncEpisode(
    pgPool,
    parsed,
    librarySeason,
    stagingMessageId,
    findOrCreateEpisode
) {
    if (
        parsed.type !== "series" ||
        !librarySeason
    ) {
        return null;
    }

    return await findOrCreateEpisode(
        pgPool,
        librarySeason.id,
        parsed,
        stagingMessageId
    );
}

module.exports = {
    syncEpisode,
};