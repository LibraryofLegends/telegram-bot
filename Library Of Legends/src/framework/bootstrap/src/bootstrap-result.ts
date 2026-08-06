/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: BootstrapResult

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0004

File................: bootstrap-result.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official result returned after the framework bootstrap
process has completed.

===============================================================================

Responsibilities

• Return the bootstrap result
• Report startup success or failure
• Expose bootstrap context
• Provide startup timestamp
• Provide optional startup messages

===============================================================================

Design Decisions

• Immutable result object
• Simple and predictable API
• Framework-independent structure
• Easy to extend without breaking compatibility
• Designed for future diagnostics integration

===============================================================================
*/

import { BootstrapContext } from "./bootstrap-context";

/**
 * Official bootstrap result returned by the Framework Core.
 */
export interface BootstrapResult {

    /**
     * Indicates whether the bootstrap completed successfully.
     */
    readonly success: boolean;

    /**
     * Timestamp when the bootstrap finished.
     */
    readonly startedAt: Date;

    /**
     * Runtime bootstrap context.
     */
    readonly context: BootstrapContext;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}