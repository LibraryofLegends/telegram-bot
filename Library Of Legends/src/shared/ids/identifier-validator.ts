/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: IdentifierValidator

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0006

File................: identifier-validator.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central validation service for all identifiers used throughout the
Library Of Legends platform.

===============================================================================
*/

export class IdentifierValidator {

    /**
     * Ensures that an identifier is not empty.
     */
    public static required(value: string): void {

        if (value.trim().length === 0) {

            throw new Error(
                "Identifier cannot be empty."
            );

        }

    }

    /**
     * Validates UUID format.
     */
    public static isUuid(value: string): boolean {

        const uuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        return uuid.test(value);

    }

    /**
     * Validates a prefix.
     */
    public static hasPrefix(
        value: string,
        prefix: string
    ): boolean {

        return value.startsWith(prefix);

    }

    /**
     * Validates minimum length.
     */
    public static minLength(
        value: string,
        length: number
    ): boolean {

        return value.length >= length;

    }

    /**
     * Validates maximum length.
     */
    public static maxLength(
        value: string,
        length: number
    ): boolean {

        return value.length <= length;

    }

}