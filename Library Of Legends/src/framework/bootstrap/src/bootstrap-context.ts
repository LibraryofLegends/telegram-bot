/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: BootstrapContext

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0002

File................: bootstrap-context.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the runtime context of the framework bootstrap process.

Stores startup options, timestamps and shared runtime information that
is passed between Framework Core components during initialization.

===============================================================================
*/

import { BootstrapOptions } from "./bootstrap-options";

export class BootstrapContext {

    /**
     * Timestamp when the bootstrap process started.
     */
    public readonly startedAt: Date;

    /**
     * Framework startup options.
     */
    public readonly options: BootstrapOptions;

    /**
     * Creates a new bootstrap context.
     */
    public constructor(
        options: BootstrapOptions
    ) {

        this.startedAt = new Date();

        this.options = options;

    }

}