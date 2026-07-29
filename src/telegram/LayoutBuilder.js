'use strict';

class LayoutBuilder {

    /**
     * Erstellt den Telegram-Beitrag.
     *
     * @param {Object} media
     * @returns {String}
     */
    build(media) {

        return [

            `🎬 <b>${media.title}</b>`,

            "",

            `📅 <b>Jahr:</b> ${media.year ?? "-"}`,

            `⭐ <b>Bewertung:</b> ${media.voteAverage ?? "-"}`,

            `🎭 <b>Genres:</b> ${(media.genres || []).join(", ")}`,

            `🌍 <b>Land:</b> ${media.country ?? "-"}`,

            `⏱ <b>Laufzeit:</b> ${media.runtime ?? "-"} Min.`,

            `🎥 <b>Auflösung:</b> ${media.resolution ?? "-"}`,

            `📀 <b>Quelle:</b> ${media.source ?? "-"}`,

            `🎞 <b>Video:</b> ${media.videoCodec ?? "-"}`,

            `🔊 <b>Audio:</b> ${media.audioCodec ?? "-"}`,

            `👥 <b>Sprachen:</b> ${(media.languages || []).join(", ")}`,

            "",

            `<b>Handlung</b>`,

            media.overview ?? "Keine Beschreibung vorhanden.",

            "",

            `🏷 #${(media.genres || []).join(" #")}`,

            "",

            `🎬 @LibraryOfLegends`

        ].join("\n");

    }

}

module.exports = LayoutBuilder;