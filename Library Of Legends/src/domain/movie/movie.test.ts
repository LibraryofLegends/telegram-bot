/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Movie Tests

Architecture Layer..: Domain

Module..............: Movie

Module ID...........: LOL-MOD-MOV-0001

LOL-ID..............: LOL-MOV-TEST-0001

File................: movie.test.ts

Location............
Library Of Legends/src/domain/movie/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Movie aggregate.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Movie } from "./movie";
import { MovieId } from "./movie-id";

import { Runtime } from "../../shared/domain/value-objects/runtime";
import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";

describe("Movie", () => {

    const movie = new Movie(
        new MovieId("MOV-000001"),
        new Title("Batman Begins"),
        new Year(2005),
        new Runtime(140)
    );

    it("should create a movie", () => {

        expect(movie.title.toString()).toBe("Batman Begins");
        expect(movie.year.valueOf()).toBe(2005);
        expect(movie.runtime.minutes).toBe(140);

    });

    it("should identify a classic movie", () => {

        expect(movie.isClassic(2035)).toBe(true);

    });

    it("should identify a non-classic movie", () => {

        expect(movie.isClassic(2015)).toBe(false);

    });

    it("should compare entities by identifier", () => {

        const other = new Movie(
            new MovieId("MOV-000001"),
            new Title("Batman Begins"),
            new Year(2005),
            new Runtime(140)
        );

        expect(movie.equals(other)).toBe(true);

    });

});