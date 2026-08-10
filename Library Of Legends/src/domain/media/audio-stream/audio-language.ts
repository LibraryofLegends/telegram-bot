/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioLanguage

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-0003

File................: audio-language.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the language of an audio stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported audio languages.
 */
export type AudioLanguageValue =
    | "DE"
    | "EN"
    | "JP"
    | "FR"
    | "ES"
    | "IT"
    | "MULTI";

/**
 * Represents an audio language.
 */
export class AudioLanguage extends ValueObject<AudioLanguageValue> {

    private static readonly NORMALIZED: Record<string, AudioLanguageValue> = {
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

        super(AudioLanguage.normalize(value));

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

    private static normalize(value: string): AudioLanguageValue {

        if (!value) {

            throw new DomainError(
                "Audio language cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = AudioLanguage.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid audio language: ${value}`
            );

        }

        return normalized;

    }

}