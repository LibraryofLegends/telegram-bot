/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Resolution Tests

Architecture Layer..: Shared Domain

Module..............: Value Objects

File................: resolution.test.ts

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DomainError } from "../errors/domain-error";
import { Resolution } from "./resolution";

describe("Resolution", () => {

    it("should create a valid resolution", () => {

        const resolution = new Resolution(1920, 1080);

        expect(resolution.width).toBe(1920);
        expect(resolution.height).toBe(1080);

    });

    it("should calculate the pixel count", () => {

        const resolution = new Resolution(1920, 1080);

        expect(resolution.pixels).toBe(2_073_600);

    });

    it("should identify Full HD", () => {

        expect(
            new Resolution(1920, 1080).isFullHD
        ).toBe(true);

    });

    it("should identify Ultra HD", () => {

        expect(
            new Resolution(3840, 2160).isUltraHD
        ).toBe(true);

    });

    it("should format correctly", () => {

        expect(
            new Resolution(3840, 2160).toString()
        ).toBe("3840x2160");

    });

    it("should reject zero width", () => {

        expect(() => {

            new Resolution(0, 1080);

        }).toThrow(DomainError);

    });

    it("should reject zero height", () => {

        expect(() => {

            new Resolution(1920, 0);

        }).toThrow(DomainError);

    });

    it("should reject negative values", () => {

        expect(() => {

            new Resolution(-1920, 1080);

        }).toThrow(DomainError);

    });

    it("should reject decimal values", () => {

        expect(() => {

            new Resolution(1920.5, 1080);

        }).toThrow(DomainError);

    });

});