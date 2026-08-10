/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: VideoStreamId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-VST-0001

LOL-ID..............: LOL-VST-0002

File................: video-stream-id.ts

Location............
Library Of Legends/src/domain/media/video-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a video stream.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a video stream.
 */
export class VideoStreamId extends EntityId {

    /**
     * Creates a new video stream identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}