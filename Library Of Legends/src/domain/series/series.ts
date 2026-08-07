/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Series

Architecture Layer..: Domain

Module..............: Series

Module ID...........: LOL-MOD-SER-0001

LOL-ID..............: LOL-SER-0001

File................: series.ts

Location............
Library Of Legends/src/domain/series/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the aggregate root for a television series.

===============================================================================
*/

import { Media } from "../../shared/domain/entities/media";

import { SeriesId } from "./series-id";

import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";

/**
 * Represents a television series.
 */
export class Series extends Media {

    public constructor(
        id: SeriesId,
        title: Title,
        year: Year
    ) {

        super(
            id,
            title,
            year
        );

    }

}