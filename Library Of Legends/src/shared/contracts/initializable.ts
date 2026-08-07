/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Initializable

Architecture Layer..: Shared Kernel

Module..............: Shared Contracts

Module ID...........: LOL-MOD-CON-0001

LOL-ID..............: LOL-CON-0001

File................: initializable.ts

Location............
Library Of Legends/src/shared/contracts/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines a common initialization contract for framework, infrastructure
and domain components.

===============================================================================
*/

export interface Initializable {

    /**
     * Indicates whether the component has already been initialized.
     */
    readonly initialized: boolean;

    /**
     * Initializes the component.
     */
    initialize(): Promise<void>;

}