/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaFile

Architecture Layer..: Domain

Module..............: Media File

Module ID...........: LOL-MOD-MEDIAFILE-0001

LOL-ID..............: LOL-MF-0001

File................: media-file.ts

Location............
Library Of Legends/src/domain/media-file/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a physical or digital media file belonging to a media item.

===============================================================================
*/

import { FileSize } from "../../shared/domain/value-objects/file-size";
import { MediaMetadata } from "../../shared/domain/value-objects/media-metadata";

/**
 * Represents one concrete media file.
 *
 * Example:
 * - 4K Remux
 * - Blu-ray
 * - WEB-DL
 * - DVD
 */
export class MediaFile {

    public constructor(
        public readonly fileName: string,
        public readonly fileSize: FileSize,
        public readonly metadata: MediaMetadata
    ) {}

}