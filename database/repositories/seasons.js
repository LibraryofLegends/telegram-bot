async function findOrCreateSeason(pgPool, seriesId, seasonNumber) {

    if (!pgPool)
        return null;

    let result = await pgPool.query(

        `
        SELECT *
        FROM seasons
        WHERE series_id=$1
        AND season_number=$2
        LIMIT 1
        `,

        [
            seriesId,
            seasonNumber
        ]

    );

    if (result.rows.length) {

        return result.rows[0];

    }

    result = await pgPool.query(

        `
        INSERT INTO seasons(
            series_id,
            season_number
        )
        VALUES(
            $1,
            $2
        )
        RETURNING *
        `,

        [
            seriesId,
            seasonNumber
        ]

    );

    console.log(
        "✅ Staffel erstellt:",
        seasonNumber
    );

    return result.rows[0];

}

module.exports = {
    findOrCreateSeason,
};