/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioStream

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-0001

File................: audio-stream.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an audio stream inside a media file.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { AudioStreamId } from "./audio-stream-id";
import { AudioLanguage } from "./audio-language";
import { AudioCodec } from "./audio-codec";
import { AudioChannels } from "./audio-channels";

/**
 * Represents an audio stream.
 */
export class AudioStream extends Entity<AudioStreamId> {

    public constructor(
        id: AudioStreamId,
        public readonly language: AudioLanguage,
        public readonly codec: AudioCodec,
        public readonly channels: AudioChannels
    ) {

        super(id);

    }

}