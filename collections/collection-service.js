const {
    getCollectionById,
    saveCollectionHubMessageId
} = require("../database/repositories/collections");

const {
    collectionHubCaption
} = require("../layouts/collection-layout");

module.exports = {

    createOrUpdateCollectionHub,
    buildCollectionData

};