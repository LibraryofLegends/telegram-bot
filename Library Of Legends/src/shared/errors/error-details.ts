/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ErrorDetails

Architecture Layer..: Shared Kernel

Module..............: Shared Errors

Module ID...........: LOL-MOD-ERR-0001

LOL-ID..............: LOL-ERR-0002

File................: error-details.ts

Location............
Library Of Legends/src/shared/errors/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents detailed information about an application error.

===============================================================================
*/

import { ErrorCode } from "./error-code";

/**
 * Represents structured error information.
 */
export interface ErrorDetails {

    /**
     * Machine-readable error code.
     */
    readonly code: ErrorCode;

    /**
     * Human-readable error message.
     */
    readonly message: string;

    /**
     * Optional component or module.
     */
    readonly source?: string;

    /**
     * Optional additional metadata.
     */
    readonly metadata?: Readonly<Record<string, unknown>>;

    /**
     * Timestamp when the error occurred.
     */
    readonly timestamp: Date;

}