'use strict';

class YearParser {

    constructor() {

        this.minYear = 1900;
        this.maxYear = new Date().getFullYear() + 2;

    }

    /**
     * Erkennt das Erscheinungsjahr.
     *
     * @param {Object} result
     * @returns {Object}
     */
    parse(result) {

        const years = result.normalized.match(/\b(19\d{2}|20\d{2})\b/g);

        if (!years) {
            return result;
        }

        for (const value of years) {

            const year = Number(value);

            if (this.isValidYear(year)) {

                result.year = year;
                break;

            }

        }

        return result;

    }

    /**
     * Prüft, ob das Jahr gültig ist.
     *
     * @param {Number} year
     * @returns {Boolean}
     */
    isValidYear(year) {

        return (
            Number.isInteger(year) &&
            year >= this.minYear &&
            year <= this.maxYear
        );

    }

    /**
     * Liefert das erste gültige Jahr.
     *
     * @param {String} text
     * @returns {Number|null}
     */
    extract(text) {

        const years = text.match(/\b(19\d{2}|20\d{2})\b/g);

        if (!years) {
            return null;
        }

        for (const value of years) {

            const year = Number(value);

            if (this.isValidYear(year)) {
                return year;
            }

        }

        return null;

    }

}

module.exports = YearParser;