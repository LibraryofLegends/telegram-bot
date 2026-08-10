/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleLanguage

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-0003

File................: subtitle-language.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the language of a subtitle stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported subtitle languages.
 */
export type SubtitleLanguageValue =
    | "DE"
    | "EN"
    | "JP"
    | "FR"
    | "ES"
    | "IT"
    | "MULTI";

/**
 * Represents a subtitle language.
 */
export class SubtitleLanguage extends ValueObject<SubtitleLanguageValue> {

    private static readonly NORMALIZED: Record<string, SubtitleLanguageValue> = {
        "DE": "DE",
        "GER": "DE",
        "GERMAN": "DE",
        "DEUTSCH": "DE",

        "EN": "EN",
        "ENG": "EN",
        "ENGLISH": "EN",

        "JP": "JP",
        "JPN": "JP",
        "JAPANESE": "JP",

        "FR": "FR",
        "FRE": "FR",
        "FRENCH": "FR",

        "ES": "ES",
        "SPA": "ES",
        "SPANISH": "ES",

        "IT": "IT",
        "ITA": "IT",
        "ITALIAN": "IT",

        "MULTI": "MULTI",
        "MULTILANG": "MULTI",
        "MULTI-LANG": "MULTI"
    };

    public constructor(value: string) {

        super(SubtitleLanguage.normalize(value));

    }

    /**
     * Returns true if language is German.
     */
    public isGerman(): boolean {

        return this.getValue() === "DE";

    }

    /**
     * Returns true if language is English.
     */
    public isEnglish(): boolean {

        return this.getValue() === "EN";

    }

    /**
     * Returns true if multi-language.
     */
    public isMulti(): boolean {

        return this.getValue() === "MULTI";

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): SubtitleLanguageValue {

        if (!value) {

            throw new DomainError(
                "Subtitle language cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = SubtitleLanguage.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid subtitle language: ${value}`
            );

        }

        return normalized;

    }

}