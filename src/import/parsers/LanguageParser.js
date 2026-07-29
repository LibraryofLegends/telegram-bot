'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * LanguageParser
 * ------------------------------------------------------------
 * Erkennt Audio-, Untertitel- und Sprachinformationen.
 * ============================================================
 */

class LanguageParser {

    constructor() {

        this.languages = [

            {
                codes: ["DE", "GER", "DEU"],
                language: "Deutsch"
            },

            {
                codes: ["EN", "ENG"],
                language: "Englisch"
            },

            {
                codes: ["FR", "FRA", "FRE"],
                language: "Französisch"
            },

            {
                codes: ["ES", "SPA"],
                language: "Spanisch"
            },

            {
                codes: ["IT", "ITA"],
                language: "Italienisch"
            },

            {
                codes: ["PT", "POR"],
                language: "Portugiesisch"
            },

            {
                codes: ["RU", "RUS"],
                language: "Russisch"
            },

            {
                codes: ["JA", "JP", "JPN"],
                language: "Japanisch"
            },

            {
                codes: ["KO", "KOR"],
                language: "Koreanisch"
            },

            {
                codes: ["ZH", "CHI", "ZHO"],
                language: "Chinesisch"
            }

        ];

    }

    /**
     * Hauptfunktion
     */
    parse(result) {

        result.languages = [];

        this.detectLanguages(result);

        this.detectAudioFlags(result);

        this.detectSubtitleFlags(result);

        return result;

    }
    
        /**
     * Erkennt Sprachcodes.
     *
     * @param {Object} result
     */
    detectLanguages(result) {

        for (const language of this.languages) {

            for (const code of language.codes) {

                const regex = new RegExp(`\\b${code}\\b`, "i");

                if (!regex.test(result.normalized)) {
                    continue;
                }

                if (!result.languages.includes(language.language)) {

                    result.languages.push(language.language);

                }

            }

        }

    }
    
        /**
     * Erkennt Audio-Informationen.
     *
     * @param {Object} result
     */
    detectAudioFlags(result) {

        result.multiAudio =
            /\bMULTI\b/i.test(result.normalized);

        result.dualAudio =
            /\bDUAL\b/i.test(result.normalized);

        result.dubbed =
            /\bDUBBED\b/i.test(result.normalized);

        result.originalAudio =
            /\bORIGINAL\b/i.test(result.normalized);

    }

    /**
     * Erkennt Untertitel-Informationen.
     *
     * @param {Object} result
     */
    detectSubtitleFlags(result) {

        result.hasSubtitles =
            /\bSUB\b|\bSUBBED\b|\bSUBS\b/i.test(result.normalized);

        result.forcedSubs =
            /\bFORCED\b/i.test(result.normalized);

        result.sdh =
            /\bSDH\b/i.test(result.normalized);

        result.commentary =
            /\bCOMMENTARY\b/i.test(result.normalized);

    }

}

module.exports = LanguageParser;