/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Genre Tests

Architecture Layer..: Domain

Module..............: Genre

Module ID...........: LOL-MOD-GEN-0001

LOL-ID..............: LOL-GEN-TEST-0001

File................: genre.test.ts

Location............
Library Of Legends/src/domain/genre/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Genre value object.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DomainError } from "../../shared/domain/errors/domain-error";
import { Genre } from "./genre";

describe("Genre", () => {

    it("should create a valid genre", () => {

        const genre = new Genre("Action");

        expect(genre.toString()).toBe("Action");

    });

    it("should trim whitespace", () => {

        const genre = new Genre("  Drama  ");

        expect(genre.toString()).toBe("Drama");

    });

    it("should reject empty values", () => {

        expect(() => {

            new Genre("");

        }).toThrow(DomainError);

    });

    it("should reject whitespace only", () => {

        expect(() => {

            new Genre("     ");

        }).toThrow(DomainError);

    });

    it("should reject values exceeding the maximum length", () => {

        expect(() => {

            new Genre("A".repeat(Genre.MAX_LENGTH + 1));

        }).toThrow(DomainError);

    });

    it("should compare genres by value", () => {

        const first = new Genre("Action");
        const second = new Genre("Action");

        expect(first.equals(second)).toBe(true);

    });

    it("should distinguish different genres", () => {

        const first = new Genre("Action");
        const second = new Genre("Comedy");

        expect(first.equals(second)).toBe(false);

    });

});