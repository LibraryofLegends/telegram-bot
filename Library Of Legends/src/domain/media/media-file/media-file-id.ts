/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaFileId

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MFL-0001

LOL-ID..............: LOL-MFL-0002

File................: media-file-id.ts

Location............
Library Of Legends/src/domain/media/media-file/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a media file.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a media file.
 */
export class MediaFileId extends EntityId {

    /**
     * Creates a new media file identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}