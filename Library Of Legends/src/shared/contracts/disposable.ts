/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Disposable

Architecture Layer..: Shared Kernel

Module..............: Shared Contracts

Module ID...........: LOL-MOD-CON-0001

LOL-ID..............: LOL-CON-0003

File................: disposable.ts

Location............
Library Of Legends/src/shared/contracts/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines a common contract for components that own disposable resources.

===============================================================================
*/

/**
 * Defines a component that can release allocated resources.
 */
export interface Disposable {

    /**
     * Releases all allocated resources.
     */
    dispose(): void | Promise<void>;

}