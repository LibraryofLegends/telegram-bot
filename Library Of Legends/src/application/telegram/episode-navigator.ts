/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EpisodeNavigator

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-NAV-0001

LOL-ID..............: LOL-TG-NAV-EP-0001

File................: episode-navigator.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production Ready

Description.........

Handles episode navigation (Next / Previous) for Telegram UI.

===============================================================================
*/

export class EpisodeNavigator {

    public static build(
        seriesId: string,
        season: number,
        episode: number,
        maxEpisodes?: number
    ) {

        const rows: any[][] = [];

        const prevEpisode =
            episode > 1
                ? `ep_${seriesId}_${season}_${episode - 1}`
                : null;

        const nextEpisode =
            maxEpisodes && episode < maxEpisodes
                ? `ep_${seriesId}_${season}_${episode + 1}`
                : null;

        const row: any[] = [];

        if (prevEpisode) {
            row.push({
                text: "⬅️ Zurück",
                callback_data: prevEpisode
            });
        }

        if (nextEpisode) {
            row.push({
                text: "➡️ Weiter",
                callback_data: nextEpisode
            });
        }

        if (row.length) {
            rows.push(row);
        }

        rows.push([
            {
                text: "📺 Serien Hub",
                callback_data: `series_${seriesId}`
            }
        ]);

        return rows;
    }
}