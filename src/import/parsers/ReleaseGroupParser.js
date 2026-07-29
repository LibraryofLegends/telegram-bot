'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * ReleaseGroupParser
 * ------------------------------------------------------------
 * Erkennt Release-Gruppen.
 * ============================================================
 */

class ReleaseGroupParser {

    constructor() {

        this.knownGroups = [

            "FraMeSToR",
            "DON",
            "CtrlHD",
            "NTb",
            "EPSiLON",
            "TayTO",
            "HiDt",
            "EbP",
            "DECIBEL",
            "CRiSC",
            "PTer",
            "WiKi",
            "MTeam",
            "HDChina",
            "HDS",
            "SPARKS",
            "GECKOS",
            "DRONES",
            "RARBG",
            "YIFY",
            "YTS",
            "FGT",
            "EVO",
            "KiNGS",
            "CRiMSON",
            "FLUX",
            "CMRG",
            "SuccessfulCrab",
            "HONE",
            "playWEB"

        ];

    }

    /**
     * Hauptfunktion
     */
    parse(result) {

        result.releaseGroup = null;
        result.releaseType = null;
        result.releaseTrust = 0;

        this.detectKnownGroup(result);

        this.detectUnknownGroup(result);

        this.detectReleaseType(result);

        return result;

    }
    
        /**
     * Erkennt bekannte Gruppen.
     *
     * @param {Object} result
     */
    detectKnownGroup(result) {

        for (const group of this.knownGroups) {

            const regex = new RegExp(
                `[-.]${group}$`,
                "i"
            );

            if (!regex.test(result.fileName)) {
                continue;
            }

            result.releaseGroup = group;

            result.releaseTrust = 100;

            return;

        }

    }

    /**
     * Erkennt unbekannte Gruppen.
     *
     * @param {Object} result
     */
    detectUnknownGroup(result) {

        if (result.releaseGroup) {
            return;
        }

        const match = result.fileName.match(
            /-([A-Za-z0-9._-]{2,30})$/
        );

        if (!match) {
            return;
        }

        result.releaseGroup = match[1];

        result.releaseTrust = 40;

    }
    
        /**
     * Erkennt den Releasetyp.
     *
     * @param {Object} result
     */
    detectReleaseType(result) {

        if (!result.releaseGroup) {
            return;
        }

        const scene = [

            "SPARKS",
            "GECKOS",
            "DRONES",
            "RARBG",
            "YIFY",
            "YTS",
            "FGT",
            "EVO"

        ];

        if (scene.includes(result.releaseGroup.toUpperCase())) {

            result.releaseType = "Scene";

            return;

        }

        result.releaseType = "P2P";

    }

}

module.exports = ReleaseGroupParser;