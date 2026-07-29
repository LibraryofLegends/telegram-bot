'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * SourceParser
 * ------------------------------------------------------------
 * Erkennt die Quelle einer Datei.
 * ============================================================
 */

class SourceParser {

    constructor() {

        this.sources = [

            {
                regex: /\bUHD[\s.-]?BLU[\s.-]?RAY\b/i,
                source: "UHD BluRay",
                rank: 100
            },

            {
                regex: /\b4K[\s.-]?BLU[\s.-]?RAY\b/i,
                source: "UHD BluRay",
                rank: 100
            },

            {
                regex: /\bBLU[\s.-]?RAY\b/i,
                source: "BluRay",
                rank: 90
            },

            {
                regex: /\bBDREMUX\b/i,
                source: "BDRemux",
                rank: 98
            },

            {
                regex: /\bREMUX\b/i,
                source: "Remux",
                rank: 97
            },

            {
                regex: /\bBDRIP\b/i,
                source: "BDRip",
                rank: 80
            },

            {
                regex: /\bBRRIP\b/i,
                source: "BRRip",
                rank: 78
            },

            {
                regex: /\bWEB[\s.-]?DL\b/i,
                source: "WEB-DL",
                rank: 85
            },

            {
                regex: /\bWEB[\s.-]?RIP\b/i,
                source: "WEBRip",
                rank: 75
            },

            {
                regex: /\bHDTV\b/i,
                source: "HDTV",
                rank: 60
            }

        ];

    }

    /**
     * Hauptfunktion
     */
    parse(result) {

        for (const entry of this.sources) {

            if (!entry.regex.test(result.normalized)) {
                continue;
            }

            result.source = entry.source;

            result.sourceRank = entry.rank;

            return result;

        }

        this.detectDVD(result);

        this.detectTV(result);

        this.detectCinema(result);

        return result;

    }
    
        detectDVD(result) {

        const list = [

            {
                regex: /\bDVDRIP\b/i,
                source: "DVDRip",
                rank: 55
            },

            {
                regex: /\bDVD5\b/i,
                source: "DVD5",
                rank: 70
            },

            {
                regex: /\bDVD9\b/i,
                source: "DVD9",
                rank: 75
            },

            {
                regex: /\bDVD\b/i,
                source: "DVD",
                rank: 50
            }

        ];

        for (const item of list) {

            if (!item.regex.test(result.normalized)) {
                continue;
            }

            result.source = item.source;
            result.sourceRank = item.rank;

            return;

        }

    }
    
        /**
     * Erkennt TV-Quellen.
     *
     * @param {Object} result
     */
    detectTV(result) {

        const list = [

            {
                regex: /\bDVBRIP\b/i,
                source: "DVBRip",
                rank: 65
            },

            {
                regex: /\bDVB\b/i,
                source: "DVB",
                rank: 62
            },

            {
                regex: /\bDVB[- ]?S2?\b/i,
                source: "DVB-S",
                rank: 63
            },

            {
                regex: /\bDVB[- ]?T2?\b/i,
                source: "DVB-T",
                rank: 61
            },

            {
                regex: /\bDVB[- ]?C\b/i,
                source: "DVB-C",
                rank: 61
            },

            {
                regex: /\bSATRIP\b/i,
                source: "SATRip",
                rank: 60
            },

            {
                regex: /\bTVRIP\b/i,
                source: "TVRip",
                rank: 55
            },

            {
                regex: /\bPDTV\b/i,
                source: "PDTV",
                rank: 58
            }

        ];

        this.detectBestSource(result, list);

    }

    /**
     * Erkennt Kinoquellen.
     *
     * @param {Object} result
     */
    detectCinema(result) {

        const list = [

            {
                regex: /\bCAM\b/i,
                source: "CAM",
                rank: 5
            },

            {
                regex: /\bHDCAM\b/i,
                source: "HDCAM",
                rank: 10
            },

            {
                regex: /\bTS\b/i,
                source: "Telesync",
                rank: 12
            },

            {
                regex: /\bHDTS\b/i,
                source: "HDTS",
                rank: 15
            },

            {
                regex: /\bTC\b/i,
                source: "Telecine",
                rank: 20
            },

            {
                regex: /\bSCR\b/i,
                source: "Screener",
                rank: 30
            },

            {
                regex: /\bDVDSCR\b/i,
                source: "DVD Screener",
                rank: 35
            },

            {
                regex: /\bR5\b/i,
                source: "R5",
                rank: 40
            }

        ];

        this.detectBestSource(result, list);

    }

    /**
     * Wählt die beste Quelle aus einer Liste.
     *
     * @param {Object} result
     * @param {Array} list
     */
    detectBestSource(result, list) {

        let best = null;

        for (const item of list) {

            if (!item.regex.test(result.normalized)) {
                continue;
            }

            if (!best || item.rank > best.rank) {

                best = item;

            }

        }

        if (!best) {
            return;
        }

        result.source = best.source;
        result.sourceRank = best.rank;

    }
    
        /**
     * Erkennt Streaming-Dienste.
     *
     * @param {Object} result
     */
    detectStreaming(result) {

        const services = [

            { regex: /\bNF\b|\bNETFLIX\b/i, service: "Netflix" },
            { regex: /\bAMZN\b|\bAMAZON\b/i, service: "Amazon Prime Video" },
            { regex: /\bDSNP\b|\bDISNEY\+\b/i, service: "Disney+" },
            { regex: /\bATVP\b|\bAPPLE\s?TV\+\b/i, service: "Apple TV+" },
            { regex: /\bHMAX\b|\bMAX\b/i, service: "Max" },
            { regex: /\bHULU\b/i, service: "Hulu" },
            { regex: /\bPCOK\b|\bPEACOCK\b/i, service: "Peacock" },
            { regex: /\bPMTP\b|\bPARAMOUNT\+\b/i, service: "Paramount+" },
            { regex: /\bBBC\b/i, service: "BBC iPlayer" },
            { regex: /\bCR\b|\bCRUNCHYROLL\b/i, service: "Crunchyroll" },
            { regex: /\bWOW\b/i, service: "WOW" },
            { regex: /\bSKY\b/i, service: "Sky" },
            { regex: /\bITUNES\b|\bIT\b/i, service: "iTunes" }

        ];

        for (const service of services) {

            if (!service.regex.test(result.normalized)) {
                continue;
            }

            result.streamingService = service.service;

            return;

        }

    }

    /**
     * Erkennt Legacy-Medien.
     *
     * @param {Object} result
     */
    detectLegacy(result) {

        const list = [

            {
                regex: /\bVHSRIP\b/i,
                source: "VHSRip",
                rank: 20
            },

            {
                regex: /\bLASERDISC\b|\bLD\b/i,
                source: "LaserDisc",
                rank: 45
            }

        ];

        this.detectBestSource(result, list);

    }
    
    parse(result) {

    for (const entry of this.sources) {

        if (!entry.regex.test(result.normalized)) {
            continue;
        }

        result.source = entry.source;
        result.sourceRank = entry.rank;

        break;

    }

    this.detectDVD(result);

    this.detectTV(result);

    this.detectCinema(result);

    this.detectLegacy(result);

    this.detectStreaming(result);

    return result;

}