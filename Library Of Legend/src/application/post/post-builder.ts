/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: PostBuilder

Architecture Layer..: Application

Module..............: Post

Module ID...........: LOL-MOD-APP-POST-0001

LOL-ID..............: LOL-POST-BUILDER-0002

File................: post-builder.ts

Location............
Library Of Legend/src/application/post/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Builds final Telegram post layout for movies.

Responsibilities:

- Format movie layout
- Integrate TMDB data
- Generate hashtags
- Inject Archive ID
- Inject Collection Progress
- Keep layout clean and consistent

===============================================================================
*/

// =============================================================================
// IMPORTS
// =============================================================================

import { CollectionProgressService } from "../collection/collection-progress";

// =============================================================================
// TYPES
// =============================================================================

export interface MoviePostInput {

    title: string;
    year?: number;
    rating?: number;
    genres: string[];
    overview?: string;

    quality?: string;
    size?: string;
    audio?: string;

    collection?: string | null;

    archiveId: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatOverview(text?: string): string {

    if (!text) return "Keine Beschreibung verfügbar.";

    let clean =
        text
            .replace(/\.\.\.+$/, "")
            .trim();

    if (!clean.endsWith(".")) {
        clean += ".";
    }

    return clean;
}

function buildHashtags(
    genres: string[],
    title: string
): string[] {

    const genreTags =
        genres.map(g => `#${g.replace(/\s+/g, "")}`);

    const titleTag =
        "#" +
        title
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .slice(0, 2)
            .join("");

    return [
        ...new Set([
            ...genreTags,
            titleTag
        ])
    ];
}

// =============================================================================
// BUILDER
// =============================================================================

export class PostBuilder {

    public static build(
        input: MoviePostInput
    ): string {

        const {
            title,
            year,
            rating,
            genres,
            overview,
            quality,
            size,
            audio,
            collection,
            archiveId
        } = input;

        // ---------------------------------------------------------------------
        // CLEAN DATA
        // ---------------------------------------------------------------------

        const cleanOverview =
            formatOverview(overview);

        const hashtags =
            buildHashtags(genres, title);

        const metaQuality =
            quality || "—";

        const metaSize =
            size || "—";

        const metaAudio =
            audio || "—";

        // ---------------------------------------------------------------------
        // COLLECTION BLOCK
        // ---------------------------------------------------------------------

        let collectionBlock = "";

        if (collection) {

            collectionBlock =
                "━━━━━━━━━━━━━━━━━━\n" +
                CollectionProgressService.formatBlock(collection) +
                "\n";
        }

        // ---------------------------------------------------------------------
        // FINAL OUTPUT
        // ---------------------------------------------------------------------

        return `
━━━━━━━━━━━━━━━━━━
🎬 ${title}${year ? ` (${year})` : ""}
━━━━━━━━━━━━━━━━━━
⭐ Bewertung: ${rating ?? "—"}/10
🎭 Genres: ${genres.join(", ")}
━━━━━━━━━━━━━━━━━━

📝 Handlung:
${cleanOverview}
━━━━━━━━━━━━━━━━━━

📦 ${metaQuality} · ${metaSize} · ${metaAudio}
━━━━━━━━━━━━━━━━━━
${collectionBlock}━━━━━━━━━━━━━━━━━━
${archiveId} ${hashtags.join(" ")}

🔥 Library Of Legends
`;
    }
}