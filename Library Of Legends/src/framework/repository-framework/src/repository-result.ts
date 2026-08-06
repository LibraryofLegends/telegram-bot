/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryResult

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0005

File................: repository-result.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Repository
Framework module.

===============================================================================

Responsibilities

• Return initialization status
• Expose Repository Framework state
• Return active configuration
• Provide runtime information
• Support future extensibility

===============================================================================

Design Decisions

• Immutable result object
• Strong TypeScript typing
• Consistent Framework API
• Predictable structure
• Forward compatible

===============================================================================

Future Extensions

• Registered repository count
• Registered provider count
• Initialization duration
• Runtime diagnostics
• Performance metrics

===============================================================================
*/

import type {
    RepositoryOptions
} from "./repository-options";

import type {
    RepositoryState
} from "./repository-state";

/**
 * Official Repository Framework initialization result.
 */
export interface RepositoryResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Repository Framework state.
     */
    readonly state: RepositoryState;

    /**
     * Active Repository Framework configuration.
     */
    readonly options: Readonly<RepositoryOptions>;

    /**
     * Number of registered repositories.
     */
    readonly registeredRepositories?: number;

    /**
     * Number of registered providers.
     */
    readonly registeredProviders?: number;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}