/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleStream Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-TEST-0001

File................: subtitle-stream.test.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the SubtitleStream entity.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { SubtitleStream } from "./subtitle-stream";
import { SubtitleStreamId } from "./subtitle-stream-id";
import { SubtitleLanguage } from "./subtitle-language";
import { SubtitleFormat } from "./subtitle-format";
import { SubtitleType } from "./subtitle-type";

describe("SubtitleStream", () => {

    const stream = new SubtitleStream(
        new SubtitleStreamId("SST-000001"),
        new SubtitleLanguage("german"),
        new SubtitleFormat("srt"),
        new SubtitleType("forced")
    );

    it("should create a subtitle stream", () => {

        expect(stream.language.toString())
            .toBe("DE");

        expect(stream.format.toString())
            .toBe("SRT");

        expect(stream.type.toString())
            .toBe("FORCED");

    });

    it("should compare entities by identifier", () => {

        const other = new SubtitleStream(
            new SubtitleStreamId("SST-000001"),
            new SubtitleLanguage("DE"),
            new SubtitleFormat("SRT"),
            new SubtitleType("FORCED")
        );

        expect(stream.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new SubtitleStream(
            new SubtitleStreamId("SST-000002"),
            new SubtitleLanguage("DE"),
            new SubtitleFormat("SRT"),
            new SubtitleType("FORCED")
        );

        expect(stream.equals(other))
            .toBe(false);

    });

    it("should detect forced subtitles", () => {

        expect(stream.type.isForced())
            .toBe(true);

    });

    it("should detect text-based subtitles", () => {

        expect(stream.format.isText())
            .toBe(true);

    });

});