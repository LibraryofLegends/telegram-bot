/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: VideoStream Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-VST-0001

LOL-ID..............: LOL-VST-TEST-0001

File................: video-stream.test.ts

Location............
Library Of Legends/src/domain/media/video-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the VideoStream entity.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { VideoStream } from "./video-stream";
import { VideoStreamId } from "./video-stream-id";
import { VideoResolution } from "./video-resolution";
import { VideoCodec } from "./video-codec";

describe("VideoStream", () => {

    const stream = new VideoStream(
        new VideoStreamId("VST-000001"),
        new VideoResolution("4K"),
        new VideoCodec("HEVC")
    );

    it("should create a video stream", () => {

        expect(stream.resolution.toString())
            .toBe("4K");

        expect(stream.codec.toString())
            .toBe("H265"); // normalized

    });

    it("should compare entities by identifier", () => {

        const other = new VideoStream(
            new VideoStreamId("VST-000001"),
            new VideoResolution("4K"),
            new VideoCodec("H265")
        );

        expect(stream.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new VideoStream(
            new VideoStreamId("VST-000002"),
            new VideoResolution("4K"),
            new VideoCodec("H265")
        );

        expect(stream.equals(other))
            .toBe(false);

    });

    it("should compare resolution correctly", () => {

        const fullHD = new VideoResolution("1080p");

        expect(stream.resolution.isHigherThan(fullHD))
            .toBe(true);

    });

    it("should identify modern codecs", () => {

        expect(stream.codec.isModern())
            .toBe(true);

    });

});