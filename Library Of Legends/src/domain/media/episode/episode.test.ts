/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Episode Tests

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-EPI-0001

LOL-ID..............: LOL-EPI-TEST-0001

File................: episode.test.ts

Location............
Library Of Legends/src/domain/media/episode/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Episode aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Title } from "../../../shared/domain/value-objects/title";

import { SeriesId } from "../series/series-id";
import { SeasonId } from "../season/season-id";

import { Episode } from "./episode";
import { EpisodeId } from "./episode-id";
import { EpisodeNumber } from "./episode-number";

describe("Episode", () => {

    const episode = new Episode(
        new EpisodeId("EPI-000001"),
        new SeriesId("SER-000001"),
        new SeasonId("SEA-000001"),
        new EpisodeNumber(1),
        new Title("Pilot")
    );

    it("should create an episode", () => {

        expect(episode.title.toString())
            .toBe("Pilot");

        expect(episode.number.value)
            .toBe(1);

    });

    it("should expose the series identifier", () => {

        expect(episode.seriesId)
            .toEqual(new SeriesId("SER-000001"));

    });

    it("should expose the season identifier", () => {

        expect(episode.seasonId)
            .toEqual(new SeasonId("SEA-000001"));

    });

    it("should compare entities by identifier", () => {

        const other = new Episode(
            new EpisodeId("EPI-000001"),
            new SeriesId("SER-000001"),
            new SeasonId("SEA-000001"),
            new EpisodeNumber(1),
            new Title("Pilot")
        );

        expect(episode.equals(other))
            .toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Episode(
            new EpisodeId("EPI-000002"),
            new SeriesId("SER-000001"),
            new SeasonId("SEA-000001"),
            new EpisodeNumber(1),
            new Title("Pilot")
        );

        expect(episode.equals(other))
            .toBe(false);

    });

    it("should identify the pilot episode", () => {

        expect(episode.number.isPilot())
            .toBe(true);

    });

});