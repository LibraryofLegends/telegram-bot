/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleStream

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-0001

File................: subtitle-stream.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a subtitle stream inside a media file.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { SubtitleStreamId } from "./subtitle-stream-id";
import { SubtitleLanguage } from "./subtitle-language";
import { SubtitleFormat } from "./subtitle-format";
import { SubtitleType } from "./subtitle-type";

/**
 * Represents a subtitle stream.
 */
export class SubtitleStream extends Entity<SubtitleStreamId> {

    public constructor(
        id: SubtitleStreamId,
        public readonly language: SubtitleLanguage,
        public readonly format: SubtitleFormat,
        public readonly type: SubtitleType
    ) {

        super(id);

    }

}