/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleStreamId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-0002

File................: subtitle-stream-id.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a subtitle stream.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a subtitle stream.
 */
export class SubtitleStreamId extends EntityId {

    /**
     * Creates a new subtitle stream identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}