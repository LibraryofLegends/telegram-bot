/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: PostBuilder

Architecture Layer..: Application

Module..............: Post

Module ID...........: LOL-MOD-APP-POST-0001

LOL-ID..............: LOL-POST-0001

File................: post-builder.ts

Location............
Library Of Legend/src/application/post/

Version.............: 2.0.0

Status..............: FINAL

Lifecycle...........: Production

Description.........

Builds final Telegram movie post.

Includes:

- Archive ID
- Hashtags
- Collection Detection
- Clean Layout
- Overview Formatting (short + clean ending)

===============================================================================
*/

import { HashtagBuilder } from "../hashtag/hashtag-builder";
import { ArchiveId } from "../archive/archive-id";
import { CollectionService } from "../collection/collection-service";

// =============================================================================
// TYPES
// =============================================================================

export interface MoviePostInput {

    title: string;
    year?: number;

    rating?: number;
    genres?: string[];

    overview?: string;

    fileName?: string;
    fileSize?: number;
}

// =============================================================================
// BUILDER
// =============================================================================

export class PostBuilder {

    // =========================================================================
    // MAIN
    // =========================================================================

    public static build(
        input: MoviePostInput
    ): string {

        const archiveId =
            ArchiveId.generate({
                genres: input.genres
            });

        const hashtags =
            HashtagBuilder.build({
                title: input.title,
                genres: input.genres
            }).join(" ");

        const collection =
            CollectionService.detect(
                input.title
            );

        const overview =
            this.formatOverview(
                input.overview
            );

        const size =
            this.formatSize(
                input.fileSize
            );

        const rating =
            input.rating
                ? `${input.rating.toFixed(1)}/10`
                : "—";

        const genres =
            input.genres?.join(", ") || "—";

        return (
`━━━━━━━━━━━━━━━━━━
🎬 ${input.title} (${input.year ?? "—"})
━━━━━━━━━━━━━━━━━━
⭐ Bewertung: ${rating}
🎭 Genres: ${genres}
━━━━━━━━━━━━━━━━━━

📝 Handlung:
${overview}
━━━━━━━━━━━━━━━━━━

📦 — · ${size} · —
━━━━━━━━━━━━━━━━━━
${collection ? `🎞 Reihe: ${collection}
━━━━━━━━━━━━━━━━━━
` : ""}${archiveId} ${hashtags}

🔥 Library Of Legends`
        );
    }

    // =========================================================================
    // OVERVIEW
    // =========================================================================

    private static formatOverview(
        text?: string
    ): string {

        if (!text) return "Keine Beschreibung verfügbar.";

        let cleaned =
            text
                .replace(/\s+/g, " ")
                .trim();

        // Kürzen (Telegram safe)
        if (cleaned.length > 500) {
            cleaned =
                cleaned.slice(0, 497) + "...";
        }

        // Punkt am Ende erzwingen
        if (!cleaned.endsWith(".")) {
            cleaned += ".";
        }

        return cleaned;
    }

    // =========================================================================
    // SIZE
    // =========================================================================

    private static formatSize(
        bytes?: number
    ): string {

        if (!bytes) return "—";

        const gb =
            bytes / (1024 * 1024 * 1024);

        return `${gb.toFixed(2)} GB`;
    }
}