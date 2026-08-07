/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesId

Architecture Layer..: Domain

Module..............: Series

Module ID...........: LOL-MOD-SER-0001

LOL-ID..............: LOL-SER-0002

File................: series-id.ts

Location............
Library Of Legends/src/domain/series/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a series entity.

===============================================================================
*/

import { MediaId } from "../../shared/domain/identifiers/media-id";

/**
 * Represents the unique identifier of a series.
 */
export class SeriesId extends MediaId {

    /**
     * Creates a new series identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}