/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Language

Architecture Layer..: Shared Domain

Module..............: Value Objects

File................: language.ts

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents an ISO 639-1 language code.
 */
export class Language extends ValueObject<string> {

    /**
     * Creates a new language.
     *
     * @param code ISO 639-1 language code.
     */
    public constructor(code: string) {

        super(Language.validate(code));

    }

    /**
     * Returns the language code.
     */
    public get code(): string {

        return this.getValue();

    }

    /**
     * Returns the language code as a string.
     */
    public override toString(): string {

        return this.code;

    }

    /**
     * Validates and normalizes an ISO 639-1 code.
     */
    private static validate(code: string): string {

        const normalized = code.trim().toLowerCase();

        if (!/^[a-z]{2}$/.test(normalized)) {

            throw new DomainError(
                "Language must be a valid ISO 639-1 code."
            );

        }

        return normalized;

    }

}