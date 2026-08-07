/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderStatus

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0002

File................: provider-status.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines the lifecycle states of every provider registered in the
Library Of Legends Provider SDK.

===============================================================================
*/

/**
 * Official provider lifecycle states.
 */
export type ProviderStatus =

    /**
     * Provider object has been created.
     */
    | "created"

    /**
     * Provider is initializing.
     */
    | "initializing"

    /**
     * Provider is loading configuration.
     */
    | "configuring"

    /**
     * Provider is authenticating.
     */
    | "authenticating"

    /**
     * Provider is connecting.
     */
    | "connecting"

    /**
     * Provider is ready for use.
     */
    | "ready"

    /**
     * Provider is temporarily unavailable.
     */
    | "degraded"

    /**
     * Provider is reconnecting.
     */
    | "reconnecting"

    /**
     * Provider is paused.
     */
    | "paused"

    /**
     * Provider is shutting down.
     */
    | "stopping"

    /**
     * Provider has been stopped.
     */
    | "stopped"

    /**
     * Provider failed.
     */
    | "failed";