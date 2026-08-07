/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: OperationResult

Architecture Layer..: Shared Kernel

Module..............: Shared Results

Module ID...........: LOL-MOD-RES-0001

LOL-ID..............: LOL-RES-0002

File................: operation-result.ts

Location............
Library Of Legends/src/shared/results/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the generic result of an operation.

===============================================================================
*/

/**
 * Represents the outcome of an operation.
 *
 * @typeParam TData Result data type.
 */
export interface OperationResult<TData = void> {

    /**
     * Indicates whether the operation completed successfully.
     */
    readonly success: boolean;

    /**
     * Optional result payload.
     */
    readonly data?: TData;

    /**
     * Optional human-readable message.
     */
    readonly message?: string;

    /**
     * Time when the operation completed.
     */
    readonly timestamp: Date;

}