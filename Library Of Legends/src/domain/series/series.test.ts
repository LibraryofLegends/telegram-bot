/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Series Tests

Architecture Layer..: Domain

Module..............: Series

Module ID...........: LOL-MOD-SER-0001

LOL-ID..............: LOL-SER-TEST-0001

File................: series.test.ts

Location............
Library Of Legends/src/domain/series/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Series aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Series } from "./series";
import { SeriesId } from "./series-id";

import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";

describe("Series", () => {

    const series = new Series(
        new SeriesId("SER-000001"),
        new Title("Breaking Bad"),
        new Year(2008)
    );

    it("should create a series", () => {

        expect(series.title.toString()).toBe("Breaking Bad");
        expect(series.year.valueOf()).toBe(2008);

    });

    it("should compare entities by identifier", () => {

        const other = new Series(
            new SeriesId("SER-000001"),
            new Title("Breaking Bad"),
            new Year(2008)
        );

        expect(series.equals(other)).toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Series(
            new SeriesId("SER-000002"),
            new Title("Breaking Bad"),
            new Year(2008)
        );

        expect(series.equals(other)).toBe(false);

    });

});