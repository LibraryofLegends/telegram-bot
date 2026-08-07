/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Season

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SEA-0001

LOL-ID..............: LOL-SEA-0001

File................: season.ts

Location............
Library Of Legends/src/domain/media/season/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a season within a television series.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { SeriesId } from "../series/series-id";

import { SeasonId } from "./season-id";
import { SeasonNumber } from "./season-number";

/**
 * Represents a television season.
 */
export class Season extends Entity<SeasonId> {

    public constructor(
        id: SeasonId,
        public readonly seriesId: SeriesId,
        public readonly number: SeasonNumber
    ) {

        super(id);

    }

}