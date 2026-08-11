/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Movie Post Builder

Architecture Layer..: Application

Module..............: Builder

Module ID...........: LOL-MOD-MOVIE-0002

LOL-ID..............: LOL-MOVIE-BUILDER-0001

File................: movie-post-builder.ts

Location............
Library Of Legend/src/application/builder/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Builds a formatted Telegram post for movies.

Responsibilities:

- Combine parser + TMDB data
- Format clean Library Of Legends post
- Add emojis, structure, metadata
- Prepare caption for Telegram send

===============================================================================
*/

export interface MoviePostInput {
    fileName: string;
    fileId: string;
    fileSize: number;

    parser: {
        title: string;
        year?: number;
        quality?: string;
        source?: string;
    };

    tmdb?: {
        title: string;
        overview?: string;
        rating?: number;
        genres?: string[];
        posterUrl?: string;
        backdropUrl?: string;
    };
}

export class MoviePostBuilder {

    public static build(input: MoviePostInput): string {

        const {
            fileName,
            fileSize,
            parser,
            tmdb
        } = input;

        // =========================================================================
        // BASIC DATA
        // =========================================================================

        const title =
            tmdb?.title ||
            parser.title ||
            "Unbekannt";

        const year =
            parser.year ||
            "----";

        const rating =
            tmdb?.rating
                ? tmdb.rating.toFixed(1)
                : "N/A";

        const genres =
            tmdb?.genres?.length
                ? tmdb.genres.join(", ")
                : "Unbekannt";

        const overview =
            tmdb?.overview ||
            "Keine Beschreibung verfügbar.";

        // =========================================================================
        // FILE SIZE FORMAT
        // =========================================================================

        const sizeInGB =
            (fileSize / (1024 * 1024 * 1024)).toFixed(2);

        // =========================================================================
        // POST BUILD
        // =========================================================================

        const post =
`
🎬 ${title} (${year})

⭐ Rating: ${rating}
🎭 Genres: ${genres}

📖 ${overview}

📁 Datei: ${fileName}
💾 Größe: ${sizeInGB} GB

━━━━━━━━━━━━━━━━━━━━
🔥 Library Of Legends
`;

        return post.trim();
    }
}