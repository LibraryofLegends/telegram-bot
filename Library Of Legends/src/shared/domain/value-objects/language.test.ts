/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Language Tests

Architecture Layer..: Shared Domain

Module..............: Value Objects

File................: language.test.ts

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { DomainError } from "../errors/domain-error";
import { Language } from "./language";

describe("Language", () => {

    it("should create a valid language", () => {

        const language = new Language("de");

        expect(language.code).toBe("de");

    });

    it("should normalize uppercase values", () => {

        const language = new Language("EN");

        expect(language.code).toBe("en");

    });

    it("should trim whitespace", () => {

        const language = new Language("  fr  ");

        expect(language.code).toBe("fr");

    });

    it("should reject empty values", () => {

        expect(() => {

            new Language("");

        }).toThrow(DomainError);

    });

    it("should reject codes shorter than two characters", () => {

        expect(() => {

            new Language("d");

        }).toThrow(DomainError);

    });

    it("should reject codes longer than two characters", () => {

        expect(() => {

            new Language("eng");

        }).toThrow(DomainError);

    });

    it("should reject numbers", () => {

        expect(() => {

            new Language("12");

        }).toThrow(DomainError);

    });

    it("should reject special characters", () => {

        expect(() => {

            new Language("d!");

        }).toThrow(DomainError);

    });

});