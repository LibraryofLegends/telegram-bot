// ======================================================
// COLLECTION UTILS
// ======================================================
//
// Hilfsfunktionen für Collections
//
// Enthält:
// - getCollectionEntryInfo()
//
// ======================================================



// ======================================================
// COLLECTION ENTRY INFO
// ======================================================

function getCollectionEntryInfo(tmdb = {}, extras = {}) {

    const order =
        Array.isArray(extras.collectionOrder)
            ? extras.collectionOrder
            : [];

    let index = 1;

    const foundIndex =
        order.findIndex((item) => {

            const entry =
                typeof item === "string"
                    ? { title: item }
                    : item || {};

            const sameId =
                entry.id &&
                tmdb.tmdbId &&
                Number(entry.id) === Number(tmdb.tmdbId);

            if (sameId) {
                return true;
            }

            const entryTitleKey =
                makeKey(entry.title || "");

            const movieTitleKey =
                makeKey(tmdb.title || "");

            const sameTitle =
                entryTitleKey &&
                movieTitleKey &&
                (
                    entryTitleKey.includes(movieTitleKey) ||
                    movieTitleKey.includes(entryTitleKey)
                );

            const sameYear =
                entry.year &&
                tmdb.year &&
                String(entry.year) === String(tmdb.year);

            return sameTitle && sameYear;

        });

    if (foundIndex >= 0) {

        index = foundIndex + 1;

    }

    const total =
        Number(
            extras.collectionMovies ||
            order.length ||
            index ||
            1
        );

    return {

        index,

        total:
            Math.max(total, index),

        indexText:
            String(index).padStart(2, "0")

    };

}



// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    getCollectionEntryInfo

};

// ======================================================
// COLLECTION CODE
// ======================================================

function getCollectionCode(collectionName) {

    // <<< komplette Funktion >>>

}



// ======================================================
// SAGA STATUS BAR
// ======================================================

function buildSagaStatusBar(index, total) {

    // <<< komplette Funktion >>>

}



// ======================================================
// SAGA INDEX
// ======================================================

function buildSagaIndex(index, total, collection) {

    // <<< komplette Funktion >>>

}