/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Episode

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-EPI-0001

LOL-ID..............: LOL-EPI-0001

File................: episode.ts

Location............
Library Of Legends/src/domain/media/episode/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a television episode.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { Title } from "../../../shared/domain/value-objects/title";

import { SeriesId } from "../series/series-id";
import { SeasonId } from "../season/season-id";

import { EpisodeId } from "./episode-id";
import { EpisodeNumber } from "./episode-number";

/**
 * Represents a television episode.
 */
export class Episode extends Entity<EpisodeId> {

    public constructor(
        id: EpisodeId,
        public readonly seriesId: SeriesId,
        public readonly seasonId: SeasonId,
        public readonly number: EpisodeNumber,
        public readonly title: Title
    ) {

        super(id);

    }

}