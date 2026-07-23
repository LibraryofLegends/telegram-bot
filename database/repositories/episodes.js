async function findOrCreateEpisode(
    pgPool,
    seasonId,
    parsed,
    stagingMessageId = null
) {

    if (!pgPool)
        return null;

    let result = await pgPool.query(

        `
        SELECT *
        FROM episodes
        WHERE season_id=$1
        AND episode_number=$2
        LIMIT 1
        `,

        [
            seasonId,
            parsed.episode
        ]

    );

    if (result.rows.length) {

        await pgPool.query(

            `
            UPDATE episodes
            SET
                staging_message_id=$1,
                imported=TRUE,
                updated_at=NOW()
            WHERE id=$2
            `,

            [
                stagingMessageId,
                result.rows[0].id
            ]

        );

        return {
            ...result.rows[0],
            alreadyExists: true
        };

    }

    const episodeNumbers =
        parsed.episodes?.length
            ? parsed.episodes
            : [parsed.episode];

    let firstEpisode = null;

    for (const episodeNumber of episodeNumbers) {

        let existing = await pgPool.query(

            `
            SELECT *
            FROM episodes
            WHERE season_id=$1
            AND episode_number=$2
            LIMIT 1
            `,

            [
                seasonId,
                episodeNumber
            ]

        );

        if (existing.rows.length) {

            await pgPool.query(

                `
                UPDATE episodes
                SET
                    staging_message_id=$1,
                    imported=TRUE,
                    updated_at=NOW()
                WHERE id=$2
                `,

                [
                    stagingMessageId,
                    existing.rows[0].id
                ]

            );

            if (!firstEpisode) {

                firstEpisode = {
                    ...existing.rows[0],
                    alreadyExists: true
                };

            }

            continue;

        }

        const inserted = await pgPool.query(

            `
            INSERT INTO episodes(
                season_id,
                episode_number,
                title,
                staging_message_id,
                imported
            )
            VALUES(
                $1,
                $2,
                $3,
                $4,
                TRUE
            )
            RETURNING *
            `,

            [
                seasonId,
                episodeNumber,
                parsed.episodeTitle || null,
                stagingMessageId
            ]

        );

        await pgPool.query(

            `
            UPDATE seasons
            SET
                imported_count = imported_count + 1,
                updated_at = NOW()
            WHERE id=$1
            `,

            [
                seasonId
            ]

        );

        if (!firstEpisode) {

            firstEpisode = {
                ...inserted.rows[0],
                alreadyExists: false
            };

        }

    }

    return firstEpisode;

}

module.exports = {
    findOrCreateEpisode,
};