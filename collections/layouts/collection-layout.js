const {
    detectCollection,
    getCollectionEntryInfo,
    getCollectionCode,
    getRatingValue,
    getRatingStars,
    trimTextAtSentence,
    buildSagaStatusBar,
    buildSagaIndex,
    escapeHtml,
    cleanTelegramText
} = require("../utils"); // <- später ggf. auf deine tatsächlichen Module anpassen

// ======================================================
// SAGA CAPTION
// ======================================================

function collectionSagaCaption(tmdb = {}, extras = {}) {

    // <<< Hier kommt deine komplette bestehende
    // collectionSagaCaption()
    // unverändert hinein >>>

}

// ======================================================
// COLLECTION HUB
// ======================================================

async function collectionHubCaption(collectionName) {

    // <<< Hier kommt deine bestehende
    // collectionHubCaption()
    // unverändert hinein >>>

}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    collectionSagaCaption,
    collectionHubCaption
};