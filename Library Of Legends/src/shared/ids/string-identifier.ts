/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: StringIdentifier

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0003

File................: string-identifier.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Base implementation for all string-based identifiers used throughout
Library Of Legends.

===============================================================================
*/

import { Identifier } from "./identifier";

export abstract class StringIdentifier extends Identifier<string> {

    protected constructor(value: string) {

        StringIdentifier.validate(value);

        super(value);

    }

    /**
     * Validates a string identifier.
     */
    protected static validate(value: string): void {

        if (typeof value !== "string") {
            throw new TypeError(
                "Identifier must be a string."
            );
        }

        if (value.trim().length === 0) {
            throw new Error(
                "Identifier cannot be empty."
            );
        }

    }

    /**
     * Indicates whether the identifier is empty.
     */
    public isEmpty(): boolean {

        return this.value.trim().length === 0;

    }

    /**
     * Returns the identifier as JSON.
     */
    public toJSON(): string {

        return this.value;

    }

}