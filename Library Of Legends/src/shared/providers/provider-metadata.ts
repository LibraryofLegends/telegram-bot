/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderMetadata

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0004

File................: provider-metadata.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Describes metadata of a provider including versioning,
vendor information and compatibility.

===============================================================================
*/

import type { ProviderType } from "./provider-type";

export interface ProviderMetadata {

    /**
     * Unique provider identifier.
     */
    readonly id: string;

    /**
     * Human-readable provider name.
     */
    readonly name: string;

    /**
     * Provider category.
     */
    readonly type: ProviderType;

    /**
     * Provider vendor.
     */
    readonly vendor: string;

    /**
     * Provider version.
     */
    readonly version: string;

    /**
     * External API version.
     */
    readonly apiVersion?: string;

    /**
     * Official provider website.
     */
    readonly website?: string;

    /**
     * Documentation URL.
     */
    readonly documentation?: string;

    /**
     * Minimum supported Framework version.
     */
    readonly minimumFrameworkVersion: string;

    /**
     * Compatible Framework versions.
     */
    readonly compatibleFrameworkVersions: readonly string[];

    /**
     * Provider priority.
     * Lower number = higher priority.
     */
    readonly priority: number;

    /**
     * Whether this provider may be used as a fallback.
     */
    readonly fallback: boolean;

    /**
     * Optional tags.
     */
    readonly tags?: readonly string[];

}