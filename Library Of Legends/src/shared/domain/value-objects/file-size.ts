/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FileSize

Architecture Layer..: Shared Domain

Module..............: Value Objects

Description.........

Represents an immutable file size measured in bytes.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents a file size.
 */
export class FileSize extends ValueObject<number> {

    private static readonly KB = 1024;
    private static readonly MB = 1024 * 1024;
    private static readonly GB = 1024 * 1024 * 1024;
    private static readonly TB = 1024 * 1024 * 1024 * 1024;

    public constructor(bytes: number) {

        FileSize.validate(bytes);

        super(bytes);

    }

    /**
     * File size in bytes.
     */
    public get bytes(): number {

        return this.getValue();

    }

    /**
     * File size in megabytes.
     */
    public get megaBytes(): number {

        return this.bytes / FileSize.MB;

    }

    /**
     * File size in gigabytes.
     */
    public get gigaBytes(): number {

        return this.bytes / FileSize.GB;

    }

    /**
     * Returns a human readable string.
     */
    public override toString(): string {

        const bytes = this.bytes;

        if (bytes >= FileSize.TB) {
            return `${(bytes / FileSize.TB).toFixed(2)} TB`;
        }

        if (bytes >= FileSize.GB) {
            return `${(bytes / FileSize.GB).toFixed(2)} GB`;
        }

        if (bytes >= FileSize.MB) {
            return `${(bytes / FileSize.MB).toFixed(2)} MB`;
        }

        if (bytes >= FileSize.KB) {
            return `${(bytes / FileSize.KB).toFixed(2)} KB`;
        }

        return `${bytes} B`;

    }

    private static validate(bytes: number): void {

        if (!Number.isInteger(bytes)) {

            throw new DomainError(
                "File size must be an integer."
            );

        }

        if (bytes < 0) {

            throw new DomainError(
                "File size cannot be negative."
            );

        }

    }

}