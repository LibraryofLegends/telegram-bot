/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0002

LOL-ID..............: LOL-POST-SER-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/post-builder/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds the final Telegram archive post for series episodes.

Responsibilities:

- Build standardized series archive posts
- Display series title
- Display season and episode
- Display Archive-ID
- Display genre
- Display category
- Display quality
- Display resolution
- Display source
- Display audio
- Display video codec
- Display file size
- Display country
- Display runtime
- Display FSK
- Display TMDB information
- Display episode information
- Generate consistent Library Of Legends formatting
- Keep missing metadata clean
- Support Telegram Markdown formatting

===============================================================================
*/

export interface SeriesPostData {

    // =========================================================================
    // BASIC INFORMATION
    // =========================================================================

    title: string;

    year?: number;

    archiveId?: string;

    genre?: string;

    category?: string;

    // =========================================================================
    // SERIES INFORMATION
    // =========================================================================

    season?: number;

    episode?: number;

    episodeTitle?: string;

    seasonEpisode?: string;

    seriesId?: string | number;

    // =========================================================================
    // TECHNICAL INFORMATION
    // =========================================================================

    quality?: string;

    resolution?: string;

    source?: string;

    audio?: string;

    audioCodec?: string;

    audioChannels?: string;

    videoCodec?: string;

    hdr?: string;

    // =========================================================================
    // CONTENT INFORMATION
    // =========================================================================

    fileSize?: number | string;

    country?: string;

    runtime?: number | string;

    fsk?: string | number;

    director?: string;

    cast?: string;

    overview?: string;

    originalLanguage?: string;

    // =========================================================================
    // TMDB
    // =========================================================================

    tmdbId?: string | number;

    tmdbRating?: string | number;

    episodeTmdbId?: string | number;

    // =========================================================================
    // FILE
    // =========================================================================

    fileName?: string;

    telegramFileId?: string;
}

/**
 * Series Post Builder
 */
export class SeriesPostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        series: SeriesPostData
    ): string {

        const title =
            this.clean(
                series.title
            ) ||
            "Unbekannte Serie";

        const lines: string[] = [];

        // =====================================================================
        // HEADER
        // =====================================================================

        lines.push(
            "📺 *LIBRARY OF LEGENDS*"
        );

        lines.push(
            ""
        );

        lines.push(
            `📺 *${this.escapeMarkdown(title)}*`
        );

        // =====================================================================
        // YEAR
        // =====================================================================

        if (
            series.year
        ) {

            lines.push(
                `📅 Jahr: ${series.year}`
            );
        }

        // =====================================================================
        // SEASON / EPISODE
        // =====================================================================

        const episodeLabel =
            this.buildEpisodeLabel(
                series
            );

        if (
            episodeLabel
        ) {

            lines.push(
                `🎞️ ${episodeLabel}`
            );
        }

        // =====================================================================
        // EPISODE TITLE
        // =====================================================================

        if (
            series.episodeTitle
        ) {

            lines.push(
                `📝 Episode: ${this.clean(series.episodeTitle)}`
            );
        }

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        if (
            series.archiveId
        ) {

            lines.push(
                `🗃️ Archiv: \`${this.clean(series.archiveId)}\``
            );
        }

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
            series.genre
        ) {

            lines.push(
                `🏷️ Genre: ${this.clean(series.genre)}`
            );
        }

        // =====================================================================
        // CATEGORY
        // =====================================================================

        if (
            series.category
        ) {

            lines.push(
                `📂 Kategorie: ${this.clean(series.category)}`
            );
        }

        // =====================================================================
        // TECHNICAL INFORMATION
        // =====================================================================

        const technical =
            this.buildTechnicalSection(
                series
            );

        if (
            technical.length > 0
        ) {

            lines.push(
                ""
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                "📊 *TECHNISCHE DATEN*"
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                ...technical
            );
        }

        // =====================================================================
        // SERIES INFORMATION
        // =====================================================================

        const information =
            this.buildInformationSection(
                series
            );

        if (
            information.length > 0
        ) {

            lines.push(
                ""
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                "📺 *SERIEN-INFORMATIONEN*"
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                ...information
            );
        }

        // =====================================================================
        // TMDB
        // =====================================================================

        const tmdb =
            this.buildTmdbSection(
                series
            );

        if (
            tmdb.length > 0
        ) {

            lines.push(
                ""
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                "🎞️ *TMDB*"
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                ...tmdb
            );
        }

        // =====================================================================
        // FILE INFORMATION
        // =====================================================================

        if (
            series.fileName ||
            series.fileSize
        ) {

            lines.push(
                ""
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                "📁 *DATEI*"
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            if (
                series.fileName
            ) {

                lines.push(
                    `📄 Datei: \`${this.clean(series.fileName)}\``
                );
            }

            if (
                series.fileSize
            ) {

                lines.push(
                    `💾 Größe: ${this.formatFileSize(series.fileSize)}`
                );
            }
        }

        // =====================================================================
        // FOOTER
        // =====================================================================

        lines.push(
            ""
        );

        lines.push(
            "━━━━━━━━━━━━━━━━━━"
        );

        lines.push(
            "🏛️ *LIBRARY OF LEGENDS*"
        );

        lines.push(
            "📺 Serienarchiv"
        );

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // EPISODE LABEL
    // =========================================================================

    private static buildEpisodeLabel(
        series: SeriesPostData
    ): string {

        if (
            series.seasonEpisode
        ) {

            return this.clean(
                series.seasonEpisode
            );
        }

        if (
            series.season !== undefined &&
            series.episode !== undefined
        ) {

            return `Staffel ${series.season} · Episode ${series.episode}`;
        }

        if (
            series.season !== undefined
        ) {

            return `Staffel ${series.season}`;
        }

        if (
            series.episode !== undefined
        ) {

            return `Episode ${series.episode}`;
        }

        return "";
    }

    // =========================================================================
    // TECHNICAL SECTION
    // =========================================================================

    private static buildTechnicalSection(
        series: SeriesPostData
    ): string[] {

        const lines: string[] = [];

        if (
            series.quality
        ) {

            lines.push(
                `🔥 Qualität: ${this.clean(series.quality)}`
            );
        }

        if (
            series.resolution
        ) {

            lines.push(
                `📺 Auflösung: ${this.clean(series.resolution)}`
            );
        }

        if (
            series.source
        ) {

            lines.push(
                `💿 Quelle: ${this.clean(series.source)}`
            );
        }

        if (
            series.audio
        ) {

            lines.push(
                `🔊 Audio: ${this.clean(series.audio)}`
            );
        }

        if (
            series.audioCodec
        ) {

            lines.push(
                `🎧 Audio-Codec: ${this.clean(series.audioCodec)}`
            );
        }

        if (
            series.audioChannels
        ) {

            lines.push(
                `🔈 Tonkanäle: ${this.clean(series.audioChannels)}`
            );
        }

        if (
            series.videoCodec
        ) {

            lines.push(
                `🎥 Video-Codec: ${this.clean(series.videoCodec)}`
            );
        }

        if (
            series.hdr
        ) {

            lines.push(
                `🌈 HDR: ${this.clean(series.hdr)}`
            );
        }

        return lines;
    }

    // =========================================================================
    // INFORMATION SECTION
    // =========================================================================

    private static buildInformationSection(
        series: SeriesPostData
    ): string[] {

        const lines: string[] = [];

        if (
            series.country
        ) {

            lines.push(
                `🌍 Land: ${this.clean(series.country)}`
            );
        }

        if (
            series.originalLanguage
        ) {

            lines.push(
                `🗣️ Originalsprache: ${this.clean(series.originalLanguage)}`
            );
        }

        if (
            series.runtime
        ) {

            lines.push(
                `⏱️ Laufzeit: ${this.formatRuntime(series.runtime)}`
            );
        }

        if (
            series.fsk !== undefined &&
            series.fsk !== null &&
            String(series.fsk).trim()
        ) {

            lines.push(
                `🔞 FSK: ${this.clean(String(series.fsk))}`
            );
        }

        if (
            series.director
        ) {

            lines.push(
                `🎥 Regie: ${this.clean(series.director)}`
            );
        }

        if (
            series.cast
        ) {

            lines.push(
                `🎭 Besetzung: ${this.clean(series.cast)}`
            );
        }

        if (
            series.seriesId
        ) {

            lines.push(
                `🆔 Serien-ID: ${this.clean(String(series.seriesId))}`
            );
        }

        if (
            series.overview
        ) {

            lines.push(
                ""
            );

            lines.push(
                "📝 *Story*"
            );

            lines.push(
                this.clean(
                    series.overview
                )
            );
        }

        return lines;
    }

    // =========================================================================
    // TMDB SECTION
    // =========================================================================

    private static buildTmdbSection(
        series: SeriesPostData
    ): string[] {

        const lines: string[] = [];

        if (
            series.tmdbId
        ) {

            lines.push(
                `🆔 TMDB Serien-ID: ${this.clean(String(series.tmdbId))}`
            );
        }

        if (
            series.episodeTmdbId
        ) {

            lines.push(
                `🎞️ TMDB Episode-ID: ${this.clean(String(series.episodeTmdbId))}`
            );
        }

        if (
            series.tmdbRating !== undefined &&
            series.tmdbRating !== null &&
            String(series.tmdbRating).trim()
        ) {

            lines.push(
                `⭐ TMDB Bewertung: ${this.clean(String(series.tmdbRating))}`
            );
        }

        return lines;
    }

    // =========================================================================
    // FILE SIZE
    // =========================================================================

    public static formatFileSize(
        value: number | string
    ): string {

        const bytes =
            typeof value === "number"
                ? value
                : Number(
                    String(value)
                        .replace(
                            ",",
                            "."
                        )
                        .replace(
                            /[^0-9.]/g,
                            ""
                        )
                );

        if (
            !Number.isFinite(
                bytes
            ) ||
            bytes <= 0
        ) {

            return String(
                value
            );
        }

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let size =
            bytes;

        let index =
            0;

        while (
            size >= 1024 &&
            index <
            units.length - 1
        ) {

            size /=
                1024;

            index++;
        }

        return `${size.toFixed(2)} ${units[index]}`;
    }

    // =========================================================================
    // RUNTIME
    // =========================================================================

    public static formatRuntime(
        value: number | string
    ): string {

        const minutes =
            Number(
                String(value)
                    .replace(
                        /[^0-9.]/g,
                        ""
                    )
            );

        if (
            !Number.isFinite(
                minutes
            ) ||
            minutes <= 0
        ) {

            return String(
                value
            );
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        const remainingMinutes =
            Math.round(
                minutes % 60
            );

        if (
            hours <= 0
        ) {

            return `${remainingMinutes} Min.`;
        }

        if (
            remainingMinutes === 0
        ) {

            return `${hours} Std.`;
        }

        return `${hours} Std. ${remainingMinutes} Min.`;
    }

    // =========================================================================
    // CLEAN
    // =========================================================================

    private static clean(
        value: unknown
    ): string {

        return String(
            value ?? ""
        )
            .trim()
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            );
    }

    // =========================================================================
    // MARKDOWN ESCAPE
    // =========================================================================

    private static escapeMarkdown(
        value: string
    ): string {

        return value
            .replace(
                /([_*[\]()~`>#+\-=|{}.!])/g,
                "\\$1"
            );
    }
}