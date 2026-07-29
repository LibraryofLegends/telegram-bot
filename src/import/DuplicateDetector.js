'use strict';

const crypto = require('crypto');
const fs = require('fs');

class DuplicateDetector {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Prüft auf Duplikate.
     *
     * @param {Object} media
     * @returns {Promise<Object>}
     */
    async check(media) {

        media.isDuplicate = false;
        media.duplicateReason = null;
        media.duplicateId = null;

        let duplicate = null;

        duplicate =
            await this.findByTMDB(media);

        duplicate ??=
            await this.findByIMDB(media);

        duplicate ??=
            await this.findByTitle(media);

        duplicate ??=
            await this.findByHash(media);

        if (!duplicate) {

            return media;

        }

        media.isDuplicate = true;
        media.duplicateId = duplicate.id;
        media.duplicateReason =
            duplicate.reason;

        media.qualityUpgrade =
            this.isBetterQuality(
                media,
                duplicate
            );

        return media;

    }

    /**
     * TMDb-ID prüfen.
     */
    async findByTMDB(media) {

        if (!media.tmdbId) {
            return null;
        }

        const result =
            await this.db.movies.findOne({

                tmdbId: media.tmdbId

            });

        if (!result) {

            return null;

        }

        result.reason = "TMDb";

        return result;

    }

    /**
     * IMDb-ID prüfen.
     */
    async findByIMDB(media) {

        if (!media.imdbId) {
            return null;
        }

        const result =
            await this.db.movies.findOne({

                imdbId: media.imdbId

            });

        if (!result) {

            return null;

        }

        result.reason = "IMDb";

        return result;

    }

    /**
     * Titel + Jahr prüfen.
     */
    async findByTitle(media) {

        if (!media.title) {
            return null;
        }

        const result =
            await this.db.movies.findOne({

                title: media.title,

                year: media.year

            });

        if (!result) {

            return null;

        }

        result.reason = "Title";

        return result;

    }

    /**
     * SHA256 Hash prüfen.
     */
    async findByHash(media) {

        if (!media.filePath) {
            return null;
        }

        const hash =
            await this.createHash(
                media.filePath
            );

        media.fileHash = hash;

        const result =
            await this.db.movies.findOne({

                fileHash: hash

            });

        if (!result) {

            return null;

        }

        result.reason = "Hash";

        return result;

    }

    /**
     * SHA256 erzeugen.
     */
    createHash(file) {

        return new Promise((resolve, reject) => {

            const hash =
                crypto.createHash('sha256');

            const stream =
                fs.createReadStream(file);

            stream.on('data', chunk => {

                hash.update(chunk);

            });

            stream.on('end', () => {

                resolve(
                    hash.digest('hex')
                );

            });

            stream.on('error', reject);

        });

    }

    /**
     * Qualitätsvergleich.
     */
    isBetterQuality(newMedia, oldMedia) {

        const score = media => {

            let value = 0;

            const resolution = {

                "480p": 10,
                "576p": 20,
                "720p": 40,
                "1080p": 60,
                "1440p": 80,
                "2160p": 100,
                "4320p": 120

            };

            value +=
                resolution[
                    media.resolution
                ] ?? 0;

            value +=
                media.releaseScore ?? 0;

            if (media.hdr) {

                value += 20;

            }

            if (
                media.videoCodec === "HEVC"
            ) {

                value += 15;

            }

            if (
                media.audioCodec ===
                "TrueHD"
            ) {

                value += 15;

            }

            return value;

        };

        return score(newMedia) >
               score(oldMedia);

    }

}

module.exports = DuplicateDetector;