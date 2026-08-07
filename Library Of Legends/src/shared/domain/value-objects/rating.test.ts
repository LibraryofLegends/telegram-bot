/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Rating Tests

Architecture Layer..: Shared Domain

Module..............: Value Objects

File................: rating.test.ts

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DomainError } from "../errors/domain-error";
import { Rating } from "./rating";

describe("Rating", () => {

    it("should create a valid rating", () => {

        const rating = new Rating(8.7);

        expect(rating.value).toBe(8.7);

    });

    it("should calculate the percentage", () => {

        const rating = new Rating(7.5);

        expect(rating.percentage).toBe(75);

    });

    it("should identify excellent ratings", () => {

        expect(new Rating(9.2).isExcellent).toBe(true);
        expect(new Rating(8.0).isExcellent).toBe(false);

    });

    it("should identify good ratings", () => {

        expect(new Rating(7.2).isGood).toBe(true);
        expect(new Rating(6.9).isGood).toBe(false);

    });

    it("should format the rating", () => {

        expect(new Rating(8).toString()).toBe("8.0");

    });

    it("should allow the minimum rating", () => {

        expect(new Rating(0).value).toBe(0);

    });

    it("should allow the maximum rating", () => {

        expect(new Rating(10).value).toBe(10);

    });

    it("should reject values below the minimum", () => {

        expect(() => {

            new Rating(-0.1);

        }).toThrow(DomainError);

    });

    it("should reject values above the maximum", () => {

        expect(() => {

            new Rating(10.1);

        }).toThrow(DomainError);

    });

    it("should reject NaN", () => {

        expect(() => {

            new Rating(Number.NaN);

        }).toThrow(DomainError);

    });

});