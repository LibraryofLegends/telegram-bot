/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Season Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SEA-0001

LOL-ID..............: LOL-SEA-TEST-0001

File................: season.test.ts

Location............
Library Of Legends/src/domain/media/season/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Season aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { SeriesId } from "../series/series-id";

import { Season } from "./season";
import { SeasonId } from "./season-id";
import { SeasonNumber } from "./season-number";

describe("Season", () => {

    const season = new Season(
        new SeasonId("SEA-000001"),
        new SeriesId("SER-000001"),
        new SeasonNumber(1)
    );

    it("should create a season", () => {

        expect(season.number.value).toBe(1);

    });

    it("should expose the series identifier", () => {

        expect(season.seriesId)
            .toEqual(new SeriesId("SER-000001"));

    });

    it("should compare entities by identifier", () => {

        const other = new Season(
            new SeasonId("SEA-000001"),
            new SeriesId("SER-000001"),
            new SeasonNumber(1)
        );

        expect(season.equals(other)).toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Season(
            new SeasonId("SEA-000002"),
            new SeriesId("SER-000001"),
            new SeasonNumber(1)
        );

        expect(season.equals(other)).toBe(false);

    });

    it("should identify specials", () => {

        const specials = new SeasonNumber(0);

        expect(specials.isSpecial()).toBe(true);

    });

});