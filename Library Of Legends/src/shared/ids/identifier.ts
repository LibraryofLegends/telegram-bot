/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Identifier

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0001

File................: identifier.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Abstract base class for all strongly typed identifiers used throughout
the Library Of Legends platform.

===============================================================================
*/

export abstract class Identifier<T> {

    /**
     * Internal identifier value.
     */
    public readonly value: T;

    protected constructor(value: T) {

        if (value === undefined || value === null) {
            throw new Error("Identifier value cannot be null or undefined.");
        }

        this.value = value;

    }

    /**
     * Compares two identifiers.
     */
    public equals(other?: Identifier<T>): boolean {

        if (!other) {
            return false;
        }

        return this.value === other.value;

    }

    /**
     * Returns the primitive identifier value.
     */
    public toValue(): T {

        return this.value;

    }

    /**
     * Returns the string representation.
     */
    public toString(): string {

        return String(this.value);

    }

}