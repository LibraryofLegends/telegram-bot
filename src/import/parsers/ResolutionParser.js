'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * ResolutionParser
 * ------------------------------------------------------------
 * Erkennt:
 *
 * 480p
 * 576p
 * 720p
 * 1080p
 * 1440p
 * 2160p
 * 4320p
 *
 * HD
 * FullHD
 * FHD
 * QHD
 * UHD
 * 4K
 * 8K
 * ============================================================
 */

class ResolutionParser {

    constructor() {

        this.patterns = [

            {
                regex: /\b480P\b/i,
                resolution: "480p",
                width: 720,
                height: 480
            },

            {
                regex: /\b576P\b/i,
                resolution: "576p",
                width: 720,
                height: 576
            },

            {
                regex: /\b720P\b/i,
                resolution: "720p",
                width: 1280,
                height: 720
            },

            {
                regex: /\b1080P\b/i,
                resolution: "1080p",
                width: 1920,
                height: 1080
            },

            {
                regex: /\b1440P\b/i,
                resolution: "1440p",
                width: 2560,
                height: 1440
            },

            {
                regex: /\b2160P\b/i,
                resolution: "2160p",
                width: 3840,
                height: 2160
            },

            {
                regex: /\b4320P\b/i,
                resolution: "4320p",
                width: 7680,
                height: 4320
            }

        ];

    }

    /**
     * Hauptfunktion
     *
     * @param {Object} result
     * @returns {Object}
     */
    parse(result) {

        for (const pattern of this.patterns) {

            if (!pattern.regex.test(result.normalized)) {
                continue;
            }

            result.resolution = pattern.resolution;

            result.width = pattern.width;

            result.height = pattern.height;

            return result;

        }

        this.detectAliases(result);

        return result;

    }
    
        /**
     * Erkennt alternative Bezeichnungen.
     *
     * UHD
     * UltraHD
     * FullHD
     * FHD
     * HD
     * QHD
     * SD
     *
     * @param {Object} result
     */
    detectAliases(result) {

        const aliases = [

            {
                regex: /\b(UHD|ULTRAHD|ULTRA-HD|4K)\b/i,
                resolution: "2160p",
                width: 3840,
                height: 2160
            },

            {
                regex: /\b8K\b/i,
                resolution: "4320p",
                width: 7680,
                height: 4320
            },

            {
                regex: /\b(FULLHD|FULL-HD|FHD)\b/i,
                resolution: "1080p",
                width: 1920,
                height: 1080
            },

            {
                regex: /\b(QHD|QUADHD|QUAD-HD)\b/i,
                resolution: "1440p",
                width: 2560,
                height: 1440
            },

            {
                regex: /\bHD\b/i,
                resolution: "720p",
                width: 1280,
                height: 720
            },

            {
                regex: /\bSD\b/i,
                resolution: "576p",
                width: 720,
                height: 576
            }

        ];

        for (const alias of aliases) {

            if (!alias.regex.test(result.normalized)) {
                continue;
            }

            result.resolution = alias.resolution;
            result.width = alias.width;
            result.height = alias.height;

            return;

        }

    }
    
        /**
     * Liefert einen numerischen Qualitätswert.
     *
     * @param {String} resolution
     * @returns {Number}
     */
    getQualityScore(resolution) {

        switch (resolution) {

            case "4320p":
                return 100;

            case "2160p":
                return 90;

            case "1440p":
                return 80;

            case "1080p":
                return 70;

            case "720p":
                return 60;

            case "576p":
                return 50;

            case "480p":
                return 40;

            default:
                return 0;

        }

    }
    
    parse(result) {

    for (const pattern of this.patterns) {

        if (!pattern.regex.test(result.normalized)) {
            continue;
        }

        result.resolution = pattern.resolution;
        result.width = pattern.width;
        result.height = pattern.height;
        result.qualityScore = this.getQualityScore(result.resolution);

        return result;

    }

    this.detectAliases(result);

    if (result.resolution) {

        result.qualityScore = this.getQualityScore(result.resolution);

    }

    return result;

}