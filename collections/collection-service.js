// ======================================================
// COLLECTION SERVICE
// ======================================================
//
// Geschäftslogik für Collections
//
// Enthält:
// - Collection-Daten aufbereiten
// - Collection Hub erstellen / aktualisieren
//
// ======================================================

// ======================================================
// IMPORTS
// ======================================================

const {
    hasPostgres,
    pgPool,
    db
} = require("../database");

const {
    getCollectionById,
    saveCollectionHubMessageId
} = require("../database/repositories/collections");

// ======================================================
// COLLECTION DATA BUILDER
// ======================================================

async function buildCollectionData(collectionName = "") {

    // =============================
    // LOAD COLLECTION MOVIES
    // =============================

    let rows = [];

    if (hasPostgres()) {

        const result = await pgPool.query(
            `
            SELECT
                title,
                year,
                library_id,
                collection,
                universe,
                rating
            FROM movies
            WHERE collection = $1
            ORDER BY year ASC, title ASC
            `,
            [collectionName]
        );

        rows = result.rows;

    } else {

        rows = db.prepare(`
            SELECT
                title,
                year,
                library_id,
                collection,
                universe,
                rating
            FROM movies
            WHERE collection = ?
            ORDER BY year ASC, title ASC
        `).all(collectionName);

    }

    // =============================
    // BASIC COUNTS
    // =============================

    const requiredMovies =
        collectionRegistry[collectionName] || [];

    const officialTotal =
        requiredMovies.length || rows.length;

    const savedMovies =
        rows.length;

    // =============================
    // RATING STATS
    // =============================

    const ratingValues = rows
        .map((m) => {

            const match =
                String(m.rating || "")
                    .match(/(\d+(\.\d+)?)/g);

            return match
                ? Number(match[match.length - 1])
                : null;

        })
        .filter((n) => Number.isFinite(n));

    const franchiseRating =
        ratingValues.length
            ? (
                ratingValues.reduce((sum, n) => sum + n, 0) /
                ratingValues.length
            ).toFixed(1)
            : "Unbekannt";

    const bestMovie =
        ratingValues.length
            ? rows
                .filter((m) =>
                    String(m.rating || "")
                        .match(/(\d+(\.\d+)?)/g)
                )
                .sort((a, b) => {

                    const ar =
                        Number(
                            String(a.rating)
                                .match(/(\d+(\.\d+)?)/g)
                                .pop()
                        );

                    const br =
                        Number(
                            String(b.rating)
                                .match(/(\d+(\.\d+)?)/g)
                                .pop()
                        );

                    return br - ar;

                })[0]
            : null;

    // =============================
    // RUNTIME STATS
    // =============================

    const totalRuntimeMinutes =
        rows.reduce((sum, m) => {

            const match =
                String(m.runtime || "")
                    .match(/\d+/);

            return sum +
                (match ? Number(match[0]) : 0);

        }, 0);

    const totalRuntimeText =
        totalRuntimeMinutes > 0
            ? `${Math.floor(totalRuntimeMinutes / 60)}h ${totalRuntimeMinutes % 60}m`
            : "Unbekannt";

    // =============================
    // FILE SIZE STATS
    // =============================

    const fileSizes =
        rows
            .map((m) =>
                parseFloat(
                    String(m.file_size || "0")
                )
            )
            .filter((n) => Number.isFinite(n));

    const largestFile =
        fileSizes.length
            ? `${Math.max(...fileSizes).toFixed(2)} GB`
            : "Unbekannt";

    // =============================
    // YEAR RANGE
    // =============================

    const years =
        rows
            .map((m) => Number(m.year))
            .filter((y) => Number.isFinite(y));

    const universePeriod =
        years.length
            ? `${Math.min(...years)} → ${Math.max(...years)}`
            : "Unbekannt";

    // =============================
    // COMPLETION PROGRESS
    // =============================

    const missingSlots =
        Math.max(
            officialTotal - savedMovies,
            0
        );

    const progressBlocks =
        "■".repeat(savedMovies) +
        "□".repeat(missingSlots);

    const storedYears =
        rows.map((m) =>
            String(m.year || "")
        );

    const missingMovies =
        requiredMovies.filter((m) =>
            !storedYears.includes(
                String(m.year)
            )
        );

    // =============================
    // CHRONOLOGY / TIMELINE
    // =============================

    const chronology =
        chronologyRegistry[collectionName] || [];

    const sortedRows =
        chronology.length
            ? rows.sort((a, b) => {

                const aIndex =
                    chronology.indexOf(
                        String(a.year)
                    );

                const bIndex =
                    chronology.indexOf(
                        String(b.year)
                    );

                return aIndex - bIndex;

            })
            : rows;

    const timeline =
        sortedRows.length
            ? sortedRows
                .map((m, index) =>
                    `${String(index + 1).padStart(2, "0")}•${m.year || "????"}`
                )
                .join(" ══▶ ")
            : "Keine Filme";

    // =============================
    // RESULT
    // =============================

    return {

        rows: sortedRows,

        savedMovies,

        officialTotal,

        progressBlocks,

        timeline,

        missingMovies,

        franchiseRating,

        bestMovie,

        totalRuntimeText,

        largestFile,

        universePeriod

    };

}

// ======================================================
// COLLECTION HUB
// ======================================================

async function createOrUpdateCollectionHub(tmdb, topicId) {

    console.log("━━━━━━━━━━━━━━━━━━");
    console.log("COLLECTION START");
    console.log("Collection:", tmdb.collection);
    console.log("Collection ID:", tmdb.collectionId);

    if (!tmdb.collection || !tmdb.collectionId) {
        return null;
    }

    const collection =
        await getCollectionById(
            tmdb.collectionId
        );

    console.log("DB:", {
        topic: collection?.topic_id,
        hub: collection?.hub_message_id
    });

    if (!collection) {
        return null;
    }

    const hubText =
        await collectionHubCaption(
            tmdb.collection
        );

    // ==================================================
    // HUB AKTUALISIEREN
    // ==================================================

    if (collection.hub_message_id) {

        const edited =
            await tg("editMessageText", {

                chat_id: MOVIE_GROUP_ID,

                message_id:
                    collection.hub_message_id,

                text: hubText

            });

        if (!edited?.__error) {

            console.log(
                "✅ Collection Hub aktualisiert:",
                tmdb.collection
            );

            return edited;
        }

        const editError =
            edited?.error?.description ||
            edited?.description ||
            "";

        if (
            editError.includes(
                "message is not modified"
            )
        ) {

            console.log(
                "ℹ️ Collection Hub unverändert:",
                tmdb.collection
            );

            return collection.hub_message_id;

        }

        if (
            editError.includes(
                "message to edit not found"
            )
        ) {

            console.log(
                "⚠️ Collection Hub Message fehlt, erstelle neu:",
                tmdb.collection
            );

        } else {

            console.log(
                "⚠️ Collection Hub Edit Fehler:",
                tmdb.collection,
                editError
            );

        }

    }

    // ==================================================
    // HUB ERSTELLEN
    // ==================================================

    console.log(
        "➡️ SENDMESSAGE:",
        tmdb.collection
    );

    let hub =
        await tg("sendMessage", {

            chat_id:
                MOVIE_GROUP_ID,

            message_thread_id:
                Number(topicId),

            text:
                hubText,

            parse_mode:
                "HTML"

        });

    const sendError =
        hub?.error?.description ||
        hub?.description ||
        "";

    // ==================================================
    // FEHLENDES TOPIC NEU ERSTELLEN
    // ==================================================

    if (
        sendError.includes(
            "message thread not found"
        )
    ) {

        console.log(
            "♻️ Topic existiert nicht mehr:",
            tmdb.collection
        );

        const newTopicId =
            await recreateTopic({

                chatId:
                    MOVIE_GROUP_ID,

                name:
                    tmdb.collection,

                type:
                    "collection"

            });

        if (!newTopicId) {
            return null;
        }

        if (hasPostgres()) {

            await pgPool.query(
                `
                UPDATE collections
                SET
                    topic_id = $1,
                    hub_message_id = NULL
                WHERE tmdb_collection_id = $2
                `,
                [
                    newTopicId,
                    tmdb.collectionId
                ]
            );

        } else {

            db.prepare(`
                UPDATE collections
                SET
                    topic_id = ?,
                    hub_message_id = NULL
                WHERE tmdb_collection_id = ?
            `).run(
                newTopicId,
                tmdb.collectionId
            );

        }

        hub =
            await tg("sendMessage", {

                chat_id:
                    MOVIE_GROUP_ID,

                message_thread_id:
                    Number(newTopicId),

                text:
                    hubText,

                parse_mode:
                    "HTML"

            });

    }

    // ==================================================
    // HUB SPEICHERN
    // ==================================================

    if (hub?.message_id) {

        await saveCollectionHubMessageId(

            tmdb.collectionId,

            hub.message_id

        );

        try {

            await tg("pinChatMessage", {

                chat_id:
                    MOVIE_GROUP_ID,

                message_id:
                    hub.message_id,

                disable_notification:
                    true

            });

        } catch (err) {

            console.error(
                "⚠️ Collection Hub Pin Fehler:",
                err.message
            );

        }

        console.log(
            "✅ Collection Hub erstellt:",
            tmdb.collection
        );

    }

    return hub;

}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    buildCollectionData,
    createOrUpdateCollectionHub

};