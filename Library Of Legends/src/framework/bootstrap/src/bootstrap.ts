/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Bootstrap

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0001

File................: bootstrap.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Description.........

Official entry point of the Project Phoenix Framework.

Responsible for coordinating the complete startup sequence of the
Framework Core.

===============================================================================
*/

import { BootstrapContext } from "./bootstrap-context";
import { BootstrapOptions } from "./bootstrap-options";
import { BootstrapResult } from "./bootstrap-result";

export class Bootstrap {

    /**
     * Starts the Project Phoenix Framework.
     */
    public async start(
        options: BootstrapOptions
    ): Promise<BootstrapResult> {

        const context = new BootstrapContext(options);

        /*
        ===============================================================

        Framework Startup Order

        ===============================================================
        */

        // Configuration

        // Logging

        // Dependency Injection

        // Lifecycle Manager

        // Event System

        // Repository Framework

        // Scheduler

        // Health Monitoring

        /*
        ===============================================================
        */

        return {

            success: true,

            startedAt: new Date(),

            context

        };

    }

}