/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Runtime Tests

Architecture Layer..: Shared Domain

Module..............: Value Objects

File................: runtime.test.ts

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DomainError } from "../errors/domain-error";
import { Runtime } from "./runtime";

describe("Runtime", () => {

    it("should create a valid runtime", () => {

        const runtime = new Runtime(125);

        expect(runtime.minutes).toBe(125);

    });

    it("should format runtime correctly", () => {

        const runtime = new Runtime(125);

        expect(runtime.toString()).toBe("2h 5m");

    });

    it("should return hours", () => {

        const runtime = new Runtime(180);

        expect(runtime.hours).toBe(3);

    });

    it("should reject zero", () => {

        expect(() => {

            new Runtime(0);

        }).toThrow(DomainError);

    });

    it("should reject negative values", () => {

        expect(() => {

            new Runtime(-10);

        }).toThrow(DomainError);

    });

    it("should reject values above the limit", () => {

        expect(() => {

            new Runtime(Runtime.MAX_MINUTES + 1);

        }).toThrow(DomainError);

    });

    it("should reject decimal values", () => {

        expect(() => {

            new Runtime(90.5);

        }).toThrow(DomainError);

    });

});