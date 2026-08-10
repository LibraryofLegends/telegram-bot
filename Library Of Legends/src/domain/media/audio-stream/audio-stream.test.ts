/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioStream Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-TEST-0001

File................: audio-stream.test.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the AudioStream entity.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { AudioStream } from "./audio-stream";
import { AudioStreamId } from "./audio-stream-id";
import { AudioLanguage } from "./audio-language";
import { AudioCodec } from "./audio-codec";
import { AudioChannels } from "./audio-channels";

describe("AudioStream", () => {

    const stream = new AudioStream(
        new AudioStreamId("AST-000001"),
        new AudioLanguage("german"),
        new AudioCodec("DTS"),
        new AudioChannels("5.1")
    );

    it("should create an audio stream", () => {

        expect(stream.language.toString())
            .toBe("DE");

        expect(stream.codec.toString())
            .toBe("DTS");

        expect(stream.channels.toString())
            .toBe("5.1");

    });

    it("should compare entities by identifier", () => {

        const other = new AudioStream(
            new AudioStreamId("AST-000001"),
            new AudioLanguage("DE"),
            new AudioCodec("DTS"),
            new AudioChannels("5.1")
        );

        expect(stream.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new AudioStream(
            new AudioStreamId("AST-000002"),
            new AudioLanguage("DE"),
            new AudioCodec("DTS"),
            new AudioChannels("5.1")
        );

        expect(stream.equals(other))
            .toBe(false);

    });

    it("should detect german language", () => {

        expect(stream.language.isGerman())
            .toBe(true);

    });

    it("should detect surround sound", () => {

        expect(stream.channels.isSurround())
            .toBe(true);

    });

    it("should detect surround capable codec", () => {

        expect(stream.codec.isSurround())
            .toBe(true);

    });

});