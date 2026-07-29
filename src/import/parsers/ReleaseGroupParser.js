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
        result.releaseScore = 0;

        this.detectKnownGroup(result);

        this.detectUnknownGroup(result);

        this.normalizeGroup(result);

        this.detectReleaseType(result);

        this.calculateGroupScore(result);

        this.detectFlags(result);

        return result;

    }

    /**
     * Erkennt bekannte Gruppen.
     *
     * @param {Object} result
     */
    detectKnownGroup(result) {

        for (const group of this.knownGroups) {

            const regex = new RegExp(`[-.]${group}$`, "i");

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

    /**
     * Qualitätsranking bekannter Release-Gruppen.
     *
     * @param {Object} result
     */
    calculateGroupScore(result) {

        const scores = {

            "FraMeSToR": 100,
            "DON": 99,
            "CtrlHD": 98,
            "NTb": 97,
            "EPSiLON": 96,
            "TayTO": 95,
            "WiKi": 94,
            "CRiSC": 93,
            "HiDt": 92,
            "EbP": 91,
            "DECIBEL": 90,
            "HDChina": 89,
            "MTeam": 88,
            "SPARKS": 85,
            "GECKOS": 84,
            "DRONES": 83,
            "FGT": 82,
            "FLUX": 81,
            "EVO": 80,
            "HONE": 79,
            "CMRG": 78,
            "SuccessfulCrab": 77,
            "playWEB": 76,
            "RARBG": 70,
            "YTS": 60,
            "YIFY": 55

        };

        result.releaseScore =
            scores[result.releaseGroup] ?? 10;

    }

    /**
     * Normalisiert Gruppennamen.
     *
     * @param {Object} result
     */
    normalizeGroup(result) {

        if (!result.releaseGroup) {
            return;
        }

        const aliases = {

            FRAMESTOR: "FraMeSToR",
            CTRLHD: "CtrlHD",
            NTB: "NTb",
            YTSMX: "YTS",
            YIFYTORRENTS: "YIFY",
            CRIMSON: "CRiMSON",
            PLAYWEB: "playWEB"

        };

        const key = result.releaseGroup
            .replace(/[^A-Za-z0-9]/g, "")
            .toUpperCase();

        if (aliases[key]) {

            result.releaseGroup = aliases[key];

        }

    }

    /**
     * Erkennt zusätzliche Eigenschaften.
     *
     * @param {Object} result
     */
    detectFlags(result) {

        result.isScene = false;
        result.isP2P = false;
        result.isInternal = false;
        result.isWebGroup = false;

        if (!result.releaseGroup) {
            return;
        }

        const scene = [

            "SPARKS",
            "GECKOS",
            "DRONES",
            "RARBG",
            "FGT"

        ];

        const web = [

            "NTb",
            "playWEB",
            "SuccessfulCrab",
            "FLUX"

        ];

        if (scene.includes(result.releaseGroup)) {

            result.isScene = true;

        } else {

            result.isP2P = true;

        }

        if (web.includes(result.releaseGroup)) {

            result.isWebGroup = true;

        }

        if (/INTERNAL/i.test(result.fileName)) {

            result.isInternal = true;

        }

    }

}

module.exports = ReleaseGroupParser;