'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * EditionParser
 * ------------------------------------------------------------
 * Erkennt verschiedene Film-Editionen.
 * ============================================================
 */

class EditionParser {

    constructor() {

        this.editions = [

            {
                regex: /\bDIRECTOR'?S?\s?CUT\b/i,
                edition: "Director's Cut",
                priority: 100
            },

            {
                regex: /\bEXTENDED(\sEDITION)?\b/i,
                edition: "Extended Edition",
                priority: 95
            },

            {
                regex: /\bFINAL\sCUT\b/i,
                edition: "Final Cut",
                priority: 94
            },

            {
                regex: /\bULTIMATE\sEDITION\b/i,
                edition: "Ultimate Edition",
                priority: 93
            },

            {
                regex: /\bCOLLECTOR'?S?\sEDITION\b/i,
                edition: "Collector's Edition",
                priority: 92
            },

            {
                regex: /\bSPECIAL\sEDITION\b/i,
                edition: "Special Edition",
                priority: 90
            },

            {
                regex: /\bDELUXE\sEDITION\b/i,
                edition: "Deluxe Edition",
                priority: 89
            },

            {
                regex: /\bANNIVERSARY\sEDITION\b/i,
                edition: "Anniversary Edition",
                priority: 88
            },

            {
                regex: /\bREMASTERED\b/i,
                edition: "Remastered",
                priority: 87
            },

            {
                regex: /\bUNRATED\b/i,
                edition: "Unrated",
                priority: 86
            }

        ];

    }

    /**
     * Hauptfunktion
     */
    parse(result) {

        let best = null;

        for (const edition of this.editions) {

            if (!edition.regex.test(result.normalized)) {
                continue;
            }

            if (!best || edition.priority > best.priority) {

                best = edition;

            }

        }

        if (best) {

            result.edition = best.edition;
            result.editionPriority = best.priority;

        }

        this.detectSpecialFormats(result);

        return result;

    }
    
        /**
     * Erkennt spezielle Fassungen.
     *
     * @param {Object} result
     */
    detectSpecialFormats(result) {

        result.imax =
            /\bIMAX\b/i.test(result.normalized);

        result.openMatte =
            /\bOPEN\sMATTE\b/i.test(result.normalized);

        result.criterion =
            /\bCRITERION\b|\bCC\b/i.test(result.normalized);

        result.restored =
            /\bRESTORED\b/i.test(result.normalized);

        result.workprint =
            /\bWORKPRINT\b/i.test(result.normalized);

        result.theatrical =
            /\bTHEATRICAL\b/i.test(result.normalized);

        result.festivalCut =
            /\bFESTIVAL\sCUT\b/i.test(result.normalized);

    }

}

module.exports = EditionParser;