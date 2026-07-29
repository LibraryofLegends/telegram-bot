'use strict';

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class ArtworkManager {

    constructor(container, options = {}) {

        this.container = container;

        this.tmdb =
            container?.resolve?.('TMDBService');

        this.artworkPath =
            options.artworkPath ??
            path.join(process.cwd(), 'artwork');

    }

    /**
     * Lädt alle verfügbaren Grafiken.
     *
     * @param {Object} media
     */
    async download(media) {

        if (!media.tmdbId) {
            return media;
        }

        await this.ensureDirectories(media);

        const artwork =
            await this.tmdb.getArtwork(
                media.tmdbId,
                media.mediaType
            );

        if (!artwork) {
            return media;
        }

        media.artwork = {};

        media.artwork.poster =
            await this.downloadImage(
                artwork.poster,
                media,
                'poster'
            );

        media.artwork.backdrop =
            await this.downloadImage(
                artwork.backdrop,
                media,
                'backdrop'
            );

        media.artwork.logo =
            await this.downloadImage(
                artwork.logo,
                media,
                'logo'
            );

        return media;

    }

    /**
     * Erstellt die Ordner.
     */
    async ensureDirectories(media) {

        const dir = path.join(

            this.artworkPath,

            media.mediaType,

            String(media.tmdbId)

        );

        await fs.mkdir(dir, {

            recursive: true

        });

    }

    /**
     * Bild herunterladen.
     */
    async downloadImage(url, media, type) {

        if (!url) {

            return null;

        }

        const extension =
            path.extname(url) || ".jpg";

        const file = path.join(

            this.artworkPath,

            media.mediaType,

            String(media.tmdbId),

            `${type}${extension}`

        );

        try {

            await fs.access(file);

            return file;

        } catch {

        }

        return await this.fetch(

            url,

            file

        );

    }

    /**
     * Datei herunterladen.
     */
    fetch(url, destination) {

        return new Promise((resolve, reject) => {

            const file =
                require('fs').createWriteStream(destination);

            https.get(url, response => {

                response.pipe(file);

                file.on('finish', () => {

                    file.close(() => {

                        resolve(destination);

                    });

                });

            }).on('error', err => {

                reject(err);

            });

        });

    }

}

module.exports = ArtworkManager;