/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

                    PROJECT PHOENIX

===============================================================================

Feature.............: Universal Media Import

Architecture Layer..: Application

Subsystem...........: Import Pipeline

Module..............: Import

Component...........: Import Job

Feature-ID..........: FEATURE-001

LOL-ID..............: LOL-IMPORT-0001

File................: import-job.ts

Location............: src/features/import/

Stability...........: Stable

===============================================================================

DESCRIPTION

Represents one complete import operation.

An ImportJob contains the complete state of a media import.

===============================================================================
*/

export enum ImportStatus {

    CREATED,

    SCANNING,

    PARSING,

    MATCHING,

    IMPORTING,

    INDEXING,

    PUBLISHING,

    COMPLETED,

    FAILED

}

export class ImportJob {

    /**
     * Job identifier.
     */
    public readonly id!: string;

    /**
     * Current status.
     */
    public status =
        ImportStatus.CREATED;

    /**
     * Import source.
     */
    public source!: string;

    /**
     * Progress.
     */
    public progress = 0;

    /**
     * Start time.
     */
    public readonly startedAt =
        new Date();

    /**
     * End time.
     */
    public finishedAt?: Date;

    /**
     * Error message.
     */
    public error?: string;

}