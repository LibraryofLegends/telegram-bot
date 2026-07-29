'use strict';

const FilenameParser = require('./FilenameParser');
const MediaInfoParser = require('./parsers/MediaInfoParser');
const MetadataEnricher = require('./MetadataEnricher');

class ImportEngine {

    constructor(container) {

        this.container = container;

        this.filenameParser = new FilenameParser();

        this.mediaInfoParser = new MediaInfoParser();

        this.metadataEnricher =
            new MetadataEnricher(container);

    }

    /**
     * Importiert eine Datei.
     *
     * @param {String} filePath
     * @returns {Promise<Object>}
     */
    async import(filePath) {

        let media = {

            filePath

        };

        media = await this.filenameParser.parse(media);

        media = await this.mediaInfoParser.parse(media);

        media = await this.metadataEnricher.enrich(media);

        return media;

    }

}

module.exports = ImportEngine;