/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaMetadata

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0009

File................: media-metadata.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents immutable technical metadata of a media file.

===============================================================================
*/

import { ValueObject } from "./value-object";

import { FileSize } from "./file-size";
import { Language } from "./language";
import { Rating } from "./rating";
import { Resolution } from "./resolution";

/**
 * Represents immutable technical metadata.
 */
export class MediaMetadata extends ValueObject<{

    language?: Language;

    rating?: Rating;

    resolution?: Resolution;

    fileSize?: FileSize;

}> {

    public constructor(
        language?: Language,
        rating?: Rating,
        resolution?: Resolution,
        fileSize?: FileSize
    ) {

        super({
            language,
            rating,
            resolution,
            fileSize
        });

    }

    public get language(): Language | undefined {

        return this.getValue().language;

    }

    public get rating(): Rating | undefined {

        return this.getValue().rating;

    }

    public get resolution(): Resolution | undefined {

        return this.getValue().resolution;

    }

    public get fileSize(): FileSize | undefined {

        return this.getValue().fileSize;

    }

}