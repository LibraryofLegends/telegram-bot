'use strict';

class TitleParser {

    /**
     * Erkennt den eigentlichen Titel.
     *
     * @param {Object} result
     * @returns {Object}
     */
    parse(result) {

        let title = result.normalized;

        // Staffel / Episode
        title = title.replace(/\bS\d{1,2}E\d{1,3}(-E\d{1,3})?\b/gi, '');
        title = title.replace(/\b\d{1,2}x\d{1,3}\b/gi, '');

        // Jahr
        title = title.replace(/\b(19\d{2}|20\d{2})\b/g, '');

        // Technische Informationen
        title = this.removeTechnicalTags(title);

        // Release Group
        title = this.removeReleaseGroup(title);

        // Sonderzeichen bereinigen
        title = title
            .replace(/[()[\]{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        result.title = title;
        result.originalTitle = title;

        return result;

    }

    /**
     * Entfernt technische Informationen.
     *
     * @param {String} title
     * @returns {String}
     */
    removeTechnicalTags(title) {

        const patterns = [

            /\b(2160P|1080P|720P|480P|4K|8K)\b/gi,

            /\b(BLURAY|WEB-DL|WEBRIP|BDRIP|BRRIP|HDTV|REMUX|DVDRIP|UHD)\b/gi,

            /\b(X264|X265|H264|H265|HEVC|AV1|AVC|VP9)\b/gi,

            /\b(AAC|AC3|DDP|DD|EAC3|TRUEHD|ATMOS|DTS|DTS-HD|PCM|FLAC)\b/gi,

            /\b(HDR10\+|HDR10|HDR|DV|DOLBY VISION|HLG|SDR)\b/gi,

            /\b(GERMAN|DEUTSCH|ENGLISH|MULTI|DUAL)\b/gi,

            /\b(EXTENDED|DIRECTOR'S CUT|UNRATED|REMASTERED|IMAX)\b/gi

        ];

        for (const pattern of patterns) {

            title = title.replace(pattern, '');

        }

        return title;

    }

    /**
     * Entfernt bekannte Release Groups.
     *
     * @param {String} title
     * @returns {String}
     */
    removeReleaseGroup(title) {

        return title.replace(/-[A-Za-z0-9]+$/g, '');

    }

}

module.exports = TitleParser;