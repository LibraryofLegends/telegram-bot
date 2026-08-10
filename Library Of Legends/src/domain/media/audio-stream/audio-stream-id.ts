/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioStreamId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-0002

File................: audio-stream-id.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for an audio stream.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of an audio stream.
 */
export class AudioStreamId extends EntityId {

    /**
     * Creates a new audio stream identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}