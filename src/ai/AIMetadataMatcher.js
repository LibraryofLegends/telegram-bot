'use strict';

class AIMetadataMatcher {

    constructor(container) {

        this.container = container;

        this.tmdb =
            container?.resolve?.('TMDBService');

    }

    /**
     * Sucht den besten Treffer.
     *
     * @param {Object} media
     */
    async match(media) {

        if (!media.title) {
            return null;
        }

        const results = await this.search(media);

        if (!results.length) {
            return null;
        }

        let best = null;
        let score = -1;

        for (const candidate of results) {

            const current =
                this.calculateScore(
                    media,
                    candidate
                );

            if (current > score) {

                score = current;
                best = candidate;

            }

        }

        return {

            confidence: score,

            match: best

        };

    }

    /**
     * TMDb durchsuchen.
     */
    async search(media) {

        if (media.mediaType === "series") {

            return await this.tmdb.searchSeriesList(

                media.title

            );

        }

        return await this.tmdb.searchMovieList(

            media.title

        );

    }

    /**
     * Score berechnen.
     */
    calculateScore(media, candidate) {

        let score = 0;

        score += this.compareTitle(

            media.title,

            candidate.title

        ) * 60;

        if (

            media.year &&
            candidate.year &&
            media.year === candidate.year

        ) {

            score += 20;

        }

        if (

            media.runtime &&
            candidate.runtime

        ) {

            const diff = Math.abs(

                media.runtime -
                candidate.runtime

            );

            if (diff <= 5) {

                score += 10;

            }

        }

        if (

            media.language &&
            candidate.language ===
            media.language

        ) {

            score += 10;

        }

        return score;

    }

    /**
     * Titel vergleichen.
     */
    compareTitle(a, b) {

        if (!a || !b) {
            return 0;
        }

        a = a.toLowerCase();
        b = b.toLowerCase();

        if (a === b) {
            return 1;
        }

        if (

            a.includes(b) ||
            b.includes(a)

        ) {

            return 0.9;

        }

        const wordsA =
            a.split(/\s+/);

        const wordsB =
            b.split(/\s+/);

        let matches = 0;

        for (const word of wordsA) {

            if (

                wordsB.includes(word)

            ) {

                matches++;

            }

        }

        return matches /

            Math.max(

                wordsA.length,

                wordsB.length

            );

    }

}

module.exports = AIMetadataMatcher;