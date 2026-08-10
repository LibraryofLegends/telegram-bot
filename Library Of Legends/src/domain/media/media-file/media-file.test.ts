/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaFile Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MFL-0001

LOL-ID..............: LOL-MFL-TEST-0001

File................: media-file.test.ts

Location............
Library Of Legends/src/domain/media/media-file/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the MediaFile aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { MediaFile } from "./media-file";
import { MediaFileId } from "./media-file-id";

import { MediaId } from "../media-id";

import { FileName } from "../../../shared/domain/value-objects/file-name";
import { FileSize } from "../../../shared/domain/value-objects/file-size";

describe("MediaFile", () => {

    const mediaFile = new MediaFile(
        new MediaFileId("MFL-000001"),
        new MediaId("MED-000001"),
        new FileName("movie.mkv"),
        new FileSize(1500000000)
    );

    it("should create a media file", () => {

        expect(mediaFile.fileName.toString())
            .toBe("movie.mkv");

        expect(mediaFile.fileSize.value)
            .toBe(1500000000);

    });

    it("should expose the media identifier", () => {

        expect(mediaFile.mediaId)
            .toEqual(new MediaId("MED-000001"));

    });

    it("should compare entities by identifier", () => {

        const other = new MediaFile(
            new MediaFileId("MFL-000001"),
            new MediaId("MED-000001"),
            new FileName("movie.mkv"),
            new FileSize(1500000000)
        );

        expect(mediaFile.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new MediaFile(
            new MediaFileId("MFL-000002"),
            new MediaId("MED-000001"),
            new FileName("movie.mkv"),
            new FileSize(1500000000)
        );

        expect(mediaFile.equals(other))
            .toBe(false);

    });

});