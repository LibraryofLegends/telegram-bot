/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0001

LOL-ID..............: LOL-POST-MOV-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/post-builder/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds the final Telegram archive post for movies.

Responsibilities:

- Build standardized movie archive posts
- Display title and year
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
- Display director
- Display TMDB information
- Generate consistent Library Of Legends formatting
- Keep missing metadata clean
- Support Telegram Markdown formatting

===============================================================================
*/

/**
 * Movie information used to build an archive post.
 */
export interface MoviePostData {

    title: string;

    year?: number;

    archiveId?: string;

    genre?: string;

    category?: string;

    quality?: string;

    resolution?: string;

    source?: string;

    audio?: string;

    videoCodec?: string;

    audioCodec?: string;

    audioChannels?: string;

    hdr?: string;

    fileSize?: number | string;

    country?: string;

    runtime?: number | string;

    fsk?: string | number;

    director?: string;

    cast?: string;

    tmdbId?: string | number;

    tmdbRating?: string | number;

    overview?: string;

    originalLanguage?: string;

    fileName?: string;

    libraryId?: string;

    telegramFileId?: string;
}

/**
 * Movie Post Builder
 */
export class MoviePostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        movie: MoviePostData
    ): string {

        const title =
            this.clean(
                movie.title
            ) ||
            "Unbekannter Film";

        const lines: string[] = [];

        // =====================================================================
        // HEADER
        // =====================================================================

        lines.push(
            "🎬 *LIBRARY OF LEGENDS*"
        );

        lines.push(
            ""
        );

        lines.push(
            `🎞️ *${this.escapeMarkdown(title)}*`
        );

        // =====================================================================
        // YEAR
        // =====================================================================

        if (
            movie.year
        ) {

            lines.push(
                `📅 Jahr: ${movie.year}`
            );
        }

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        if (
            movie.archiveId
        ) {

            lines.push(
                `🗃️ Archiv: \`${this.clean(movie.archiveId)}\``
            );
        }

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
            movie.genre
        ) {

            lines.push(
                `🏷️ Genre: ${this.clean(movie.genre)}`
            );
        }

        // =====================================================================
        // CATEGORY
        // =====================================================================

        if (
            movie.category
        ) {

            lines.push(
                `📂 Kategorie: ${this.clean(movie.category)}`
            );
        }

        // =====================================================================
        // TECHNICAL INFORMATION
        // =====================================================================

        const technical =
            this.buildTechnicalSection(
                movie
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
        // CONTENT INFORMATION
        // =====================================================================

        const content =
            this.buildContentSection(
                movie
            );

        if (
            content.length > 0
        ) {

            lines.push(
                ""
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                "🎬 *FILM-INFORMATIONEN*"
            );

            lines.push(
                "━━━━━━━━━━━━━━━━━━"
            );

            lines.push(
                ...content
            );
        }

        // =====================================================================
        // TMDB
        // =====================================================================

        const tmdb =
            this.buildTmdbSection(
                movie
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
            movie.fileName ||
            movie.fileSize
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
                movie.fileName
            ) {

                lines.push(
                    `📄 Datei: \`${this.clean(movie.fileName)}\``
                );
            }

            if (
                movie.fileSize
            ) {

                lines.push(
                    `💾 Größe: ${this.formatFileSize(movie.fileSize)}`
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
            "🎬 Filmarchiv"
        );

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // TECHNICAL SECTION
    // =========================================================================

    private static buildTechnicalSection(
        movie: MoviePostData
    ): string[] {

        const lines: string[] = [];

        if (
            movie.quality
        ) {

            lines.push(
                `🔥 Qualität: ${this.clean(movie.quality)}`
            );
        }

        if (
            movie.resolution
        ) {

            lines.push(
                `📺 Auflösung: ${this.clean(movie.resolution)}`
            );
        }

        if (
            movie.source
        ) {

            lines.push(
                `💿 Quelle: ${this.clean(movie.source)}`
            );
        }

        if (
            movie.audio
        ) {

            lines.push(
                `🔊 Audio: ${this.clean(movie.audio)}`
            );
        }

        if (
            movie.audioCodec
        ) {

            lines.push(
                `🎧 Audio-Codec: ${this.clean(movie.audioCodec)}`
            );
        }

        if (
            movie.audioChannels
        ) {

            lines.push(
                `🔈 Tonkanäle: ${this.clean(movie.audioChannels)}`
            );
        }

        if (
            movie.videoCodec
        ) {

            lines.push(
                `🎥 Video-Codec: ${this.clean(movie.videoCodec)}`
            );
        }

        if (
            movie.hdr
        ) {

            lines.push(
                `🌈 HDR: ${this.clean(movie.hdr)}`
            );
        }

        return lines;
    }

    // =========================================================================
    // CONTENT SECTION
    // =========================================================================

    private static buildContentSection(
        movie: MoviePostData
    ): string[] {

        const lines: string[] = [];

        if (
            movie.country
        ) {

            lines.push(
                `🌍 Land: ${this.clean(movie.country)}`
            );
        }

        if (
            movie.originalLanguage
        ) {

            lines.push(
                `🗣️ Originalsprache: ${this.clean(movie.originalLanguage)}`
            );
        }

        if (
            movie.runtime
        ) {

            lines.push(
                `⏱️ Laufzeit: ${this.formatRuntime(movie.runtime)}`
            );
        }

        if (
            movie.fsk !== undefined &&
            movie.fsk !== null &&
            String(movie.fsk).trim()
        ) {

            lines.push(
                `🔞 FSK: ${this.clean(String(movie.fsk))}`
            );
        }

        if (
            movie.director
        ) {

            lines.push(
                `🎥 Regie: ${this.clean(movie.director)}`
            );
        }

        if (
            movie.cast
        ) {

            lines.push(
                `🎭 Besetzung: ${this.clean(movie.cast)}`
            );
        }

        if (
            movie.overview
        ) {

            lines.push(
                ""
            );

            lines.push(
                `📝 *Story*`
            );

            lines.push(
                this.clean(
                    movie.overview
                )
            );
        }

        return lines;
    }

    // =========================================================================
    // TMDB SECTION
    // =========================================================================

    private static buildTmdbSection(
        movie: MoviePostData
    ): string[] {

        const lines: string[] = [];

        if (
            movie.tmdbId
        ) {

            lines.push(
                `🆔 TMDB-ID: ${this.clean(String(movie.tmdbId))}`
            );
        }

        if (
            movie.tmdbRating !== undefined &&
            movie.tmdbRating !== null &&
            String(movie.tmdbRating).trim()
        ) {

            lines.push(
                `⭐ TMDB Bewertung: ${this.clean(String(movie.tmdbRating))}`
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