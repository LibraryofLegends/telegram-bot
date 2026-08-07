/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaMetadata

Architecture Layer..: Shared Domain

Module..............: Entities

Module ID...........: LOL-MOD-DOM-0002

LOL-ID..............: LOL-ENT-0004

File................: media-metadata.ts

Location............
Library Of Legends/src/shared/domain/entities/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the technical metadata of a media item.

===============================================================================
*/

import { FileSize } from "../value-objects/file-size";
import { Language } from "../value-objects/language";
import { Rating } from "../value-objects/rating";
import { Resolution } from "../value-objects/resolution";

/**
 * Represents technical metadata for a media item.
 */
export class MediaMetadata {

    public constructor(
        public readonly language?: Language,
        public readonly rating?: Rating,
        public readonly resolution?: Resolution,
        public readonly fileSize?: FileSize
    ) {}

}