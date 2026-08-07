/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Lifecycle

Architecture Layer..: Shared Kernel

Module..............: Shared Contracts

Module ID...........: LOL-MOD-CON-0001

LOL-ID..............: LOL-CON-0005

File................: lifecycle.ts

Location............
Library Of Legends/src/shared/contracts/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Combines the fundamental lifecycle contracts into a single reusable
interface for components that support initialization, health checks
and resource disposal.

===============================================================================
*/

import type { Disposable } from "./disposable";
import type { HealthCheckable } from "./health-checkable";
import type { Initializable } from "./initializable";

/**
 * Represents a component with a complete lifecycle.
 */
export interface Lifecycle
    extends Initializable,
            HealthCheckable,
            Disposable {
}