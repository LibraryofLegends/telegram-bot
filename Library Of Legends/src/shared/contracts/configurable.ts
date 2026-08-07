/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Configurable

Architecture Layer..: Shared Kernel

Module..............: Shared Contracts

Module ID...........: LOL-MOD-CON-0001

LOL-ID..............: LOL-CON-0002

File................: configurable.ts

Location............
Library Of Legends/src/shared/contracts/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines a common configuration contract for configurable components.

===============================================================================
*/

/**
 * Defines a component that can be configured.
 *
 * @typeParam TOptions - Configuration object type.
 */
export interface Configurable<TOptions> {

    /**
     * Applies the supplied configuration.
     *
     * @param options Configuration object.
     */
    configure(
        options: Readonly<TOptions>
    ): void | Promise<void>;

}