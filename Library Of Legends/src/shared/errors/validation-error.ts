/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ValidationError

Architecture Layer..: Shared Kernel

Module..............: Shared Errors

Module ID...........: LOL-MOD-ERR-0001

LOL-ID..............: LOL-ERR-0003

File................: validation-error.ts

Location............
Library Of Legends/src/shared/errors/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a validation-specific application error.

===============================================================================
*/

import type { ErrorDetails } from "./error-details";

/**
 * Represents a validation error.
 */
export interface ValidationError extends ErrorDetails {

    /**
     * Name of the invalid field or property.
     */
    readonly field: string;

    /**
     * Invalid value that caused the validation error.
     */
    readonly value?: unknown;

}