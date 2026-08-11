/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesHubBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-HUB-0001

LOL-ID..............: LOL-TG-HUB-SER-0001

File................: series-hub-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production Ready

Description.........

Builds the Netflix-style Series Hub (main entry screen).

===============================================================================
*/

export class SeriesHubBuilder {

    public static build(series: any) {

        const title = series.title || "Unbekannt";
        const seasons = series.seasons || [];

        const buttons: any[][] = [];

        // Staffeln
        seasons.forEach((s: number) => {
            buttons.push([
                {
                    text: `📀 Staffel ${s}`,
                    callback_data: `season_${series.id}_${s}`
                }
            ]);
        });

        // Zusatzfunktionen
        buttons.push([
            {
                text: "🔥 Beliebte Episoden",
                callback_data: `trending_${series.id}`
            }
        ]);

        buttons.push([
            {
                text: "⭐ Favoriten",
                callback_data: `favorites_${series.id}`
            }
        ]);

        return {
            caption: `
📺 <b>${title}</b>

━━━━━━━━━━━━━━━━━━

🎬 Wähle eine Staffel:

━━━━━━━━━━━━━━━━━━
            `.trim(),
            buttons,
            parseMode: "HTML"
        };
    }
}