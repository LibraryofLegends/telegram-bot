'use strict';

/**
 * ============================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------
 * SeriesParser
 * ------------------------------------------------------------
 * Erkennt Serieninformationen aus Dateinamen.
 *
 * Unterstützte Formate:
 *
 * S01E01
 * S01E01E02
 * S01E01-E03
 * 1x05
 * Season 1 Episode 2
 * Staffel 2 Folge 8
 * Episode 123
 * OVA 01
 * Special 02
 * Movie 01
 * Part 1
 * ============================================================
 */

class SeriesParser {

    constructor() {

        this.patterns = [

            // S01E01
            /S(\d{1,2})E(\d{1,4})/i,

            // 1x05
            /(\d{1,2})x(\d{1,4})/i,

            // Season 1 Episode 2
            /Season\s+(\d{1,2})\s+Episode\s+(\d{1,4})/i,

            // Staffel 1 Folge 2
            /Staffel\s+(\d{1,2})\s+Folge\s+(\d{1,4})/i

        ];

    }

    /**
     * Hauptfunktion
     *
     * @param {Object} result
     * @returns {Object}
     */
    parse(result) {

        this.detectStandardEpisode(result);

        this.detectEpisodeRange(result);

        this.detectSpecial(result);

        this.detectOVA(result);

        this.detectMovie(result);

        return result;

    }

    /**
     * Erkennt normale Episoden.
     *
     * @param {Object} result
     */
    detectStandardEpisode(result) {

        for (const pattern of this.patterns) {

            const match = result.normalized.match(pattern);

            if (!match) {
                continue;
            }

            result.mediaType = 'series';

            result.season = Number(match[1]);

            result.episode = Number(match[2]);

            result.episodes = [
                result.episode
            ];

            return;

        }

    }

    /**
     * Erkennt Episodenbereiche.
     *
     * Unterstützt:
     * S01E01E02
     * S01E01-E03
     * S01E01-03
     *
     * @param {Object} result
     */
    detectEpisodeRange(result) {

        let match = result.normalized.match(/S(\d{1,2})E(\d{1,4})E(\d{1,4})/i);

        if (!match) {

            match = result.normalized.match(/S(\d{1,2})E(\d{1,4})-E?(\d{1,4})/i);

        }

        if (!match) {
            return;
        }

        result.mediaType = 'series';

        result.season = Number(match[1]);

        const startEpisode = Number(match[2]);
        const endEpisode = Number(match[3]);

        result.episode = startEpisode;
        result.episodes = [];

        for (let i = startEpisode; i <= endEpisode; i++) {

            result.episodes.push(i);

        }

    }

    /**
     * Erkennt Specials.
     *
     * Beispiele:
     * Special 01
     * Special 2
     * SP01
     *
     * @param {Object} result
     */
    detectSpecial(result) {

        const match = result.normalized.match(/(?:SPECIAL|SP)\s?(\d{1,3})/i);

        if (!match) {
            return;
        }

        result.mediaType = 'special';

        result.season = 0;

        result.episode = Number(match[1]);

        result.episodes = [
            result.episode
        ];

    }

    /**
     * Erkennt OVA/OAD.
     *
     * Beispiele:
     * OVA 01
     * OAD02
     *
     * @param {Object} result
     */
    detectOVA(result) {

        const match = result.normalized.match(/(?:OVA|OAD)\s?(\d{1,3})/i);

        if (!match) {
            return;
        }

        result.mediaType = 'ova';

        result.season = 0;

        result.episode = Number(match[1]);

        result.episodes = [
            result.episode
        ];

    }

    /**
     * Erkennt Serienfilme.
     *
     * Beispiele:
     * Movie 01
     * Film 2
     *
     * @param {Object} result
     */
    detectMovie(result) {

        const match = result.normalized.match(/(?:MOVIE|FILM)\s?(\d{1,3})/i);

        if (!match) {
            return;
        }

        result.mediaType = 'movie';

        result.season = null;

        result.episode = Number(match[1]);

        result.episodes = [
            result.episode
        ];

    }

    /**
     * Erkennt Anime-Episoden.
     *
     * Beispiele:
     * One Piece - 1074
     * Naruto 220
     * Bleach Episode 366
     *
     * @param {Object} result
     */
    detectAnime(result) {

        const match = result.normalized.match(
            /(?:EPISODE\s*)?(\d{2,4})$/i
        );

        if (!match) {
            return;
        }

        if (result.mediaType !== 'unknown') {
            return;
        }

        result.mediaType = 'anime';

        result.season = 1;

        result.episode = Number(match[1]);

        result.episodes = [
            result.episode
        ];

    }

    /**
     * Erkennt Daily Shows.
     *
     * Beispiele:
     * 2026.07.30
     * 2026-07-30
     *
     * @param {Object} result
     */
    detectDailyEpisode(result) {

        const match = result.normalized.match(
            /\b(20\d{2})[.\-](\d{2})[.\-](\d{2})\b/
        );

        if (!match) {
            return;
        }

        result.mediaType = 'series';

        result.airDate = `${match[1]}-${match[2]}-${match[3]}`;

    }

    /**
     * Erkennt komplette Staffeln.
     *
     * Beispiele:
     * Season 01 Complete
     * Staffel 3 Komplett
     * Complete Season 2
     *
     * @param {Object} result
     */
    detectCompleteSeason(result) {

        let match = result.normalized.match(
            /Season\s*(\d{1,2})\s*Complete/i
        );

        if (!match) {

            match = result.normalized.match(
                /Complete\s*Season\s*(\d{1,2})/i
            );

        }

        if (!match) {

            match = result.normalized.match(
                /Staffel\s*(\d{1,2})\s*Komplett/i
            );

        }

        if (!match) {
            return;
        }

        result.mediaType = 'season';

        result.season = Number(match[1]);

        result.completeSeason = true;

    }

    /**
     * Erkennt Disc-Informationen.
     *
     * Beispiele:
     * Disc 1
     * CD2
     * Disk 03
     *
     * @param {Object} result
     */
    detectDisc(result) {

        const match = result.normalized.match(
            /(?:DISC|DISK|CD)\s?(\d{1,2})/i
        );

        if (!match) {
            return;
        }

        result.disc = Number(match[1]);

    }

    /**
     * Erkennt Bonusmaterial.
     *
     * Beispiele:
     * Extras
     * Bonus
     * Deleted Scenes
     * Behind The Scenes
     * Featurette
     *
     * @param {Object} result
     */
    detectBonus(result) {

        const patterns = [

            /EXTRAS?/i,
            /BONUS/i,
            /FEATURETTES?/i,
            /BEHIND\s+THE\s+SCENES/i,
            /DELETED\s+SCENES/i,
            /INTERVIEW/i,
            /MAKING\s+OF/i,
            /OUTTAKES/i,
            /BLOOPERS/i

        ];

        for (const pattern of patterns) {

            if (!pattern.test(result.normalized)) {
                continue;
            }

            result.mediaType = 'bonus';
            result.isBonus = true;

            return;

        }

    }

    /**
     * Erkennt Miniserien.
     *
     * @param {Object} result
     */
    detectMiniSeries(result) {

        if (!/MINI\s*SERIES/i.test(result.normalized)) {
            return;
        }

        result.isMiniSeries = true;

    }

    /**
     * Erkennt Parts.
     *
     * Beispiele:
     * Part 1
     * Part II
     * Pt.3
     *
     * @param {Object} result
     */
    detectPart(result) {

        const match = result.normalized.match(
            /(?:PART|PT\.?)\s*([0-9IVX]+)/i
        );

        if (!match) {
            return;
        }

        result.part = match[1];

    }

    /**
     * Berechnet die Erkennungsqualität.
     *
     * @param {Object} result
     */
    calculateConfidence(result) {

        let score = 0;

        if (result.mediaType !== 'unknown')
            score += 30;

        if (result.season !== null)
            score += 20;

        if (result.episode !== null)
            score += 20;

        if (result.completeSeason)
            score += 10;

        if (result.airDate)
            score += 10;

        if (result.disc)
            score += 5;

        if (result.isBonus)
            score += 5;

        result.confidence = Math.min(score, 100);

    }