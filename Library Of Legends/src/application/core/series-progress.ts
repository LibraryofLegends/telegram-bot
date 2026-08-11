/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesProgress

Architecture Layer..: Application

Module..............: Core

Module ID...........: LOL-MOD-CORE-0001

LOL-ID..............: LOL-CORE-PROG-0001

File................: series-progress.ts

Location............
Library Of Legends/src/application/core/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production Ready

Description.........

Calculates and formats series progress (episodes available vs total).

===============================================================================
*/

export class SeriesProgress {

    public static build(
        available: number,
        total: number
    ): string {

        if (!total || total <= 0) {
            return "";
        }

        const percent =
            Math.floor((available / total) * 100);

        return `⚠️ ${available}/${total} Episoden (${percent}%) verfügbar`;
    }
}