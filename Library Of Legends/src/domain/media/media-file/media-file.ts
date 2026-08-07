/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaFile

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MFL-0001

LOL-ID..............: LOL-MFL-0001

File................: media-file.ts

Location............
Library Of Legends/src/domain/media/media-file/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a physical media file stored in the library.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { MediaId } from "../media-id";

import { FileName } from "../../../shared/domain/value-objects/file-name";
import { FileSize } from "../../../shared/domain/value-objects/file-size";

import { MediaFileId } from "./media-file-id";

/**
 * Represents a physical media file.
 */
export class MediaFile extends Entity<MediaFileId> {

    public constructor(
        id: MediaFileId,
        public readonly mediaId: MediaId,
        public readonly fileName: FileName,
        public readonly fileSize: FileSize
    ) {

        super(id);

    }

}