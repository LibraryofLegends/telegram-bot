/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: VideoStream

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-VST-0001

LOL-ID..............: LOL-VST-0001

File................: video-stream.ts

Location............
Library Of Legends/src/domain/media/video-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a video stream inside a media file.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";

import { VideoStreamId } from "./video-stream-id";
import { VideoResolution } from "./video-resolution";
import { VideoCodec } from "./video-codec";

/**
 * Represents a video stream.
 */
export class VideoStream extends Entity<VideoStreamId> {

    public constructor(
        id: VideoStreamId,
        public readonly resolution: VideoResolution,
        public readonly codec: VideoCodec
    ) {

        super(id);

    }

}