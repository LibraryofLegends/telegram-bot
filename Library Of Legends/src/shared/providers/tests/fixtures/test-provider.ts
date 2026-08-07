/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TestProvider

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-TST-0100

Description.........

Reusable Provider implementation used throughout the Provider SDK
test suite.

===============================================================================
*/

import type { Provider } from "../../provider";
import type { ProviderOptions } from "../../provider-options";
import type { ProviderResult } from "../../provider-result";

export class TestProvider implements Provider {

    public readonly metadata = {
        id: "test-provider",
        name: "Test Provider",
        type: "custom",
        vendor: "Library Of Legends",
        version: "1.0.0",
        minimumFrameworkVersion: "1.0.0",
        compatibleFrameworkVersions: ["1.0.0"],
        priority: 1,
        fallback: false
    };

    public readonly capabilities = {
        supportsSearch: true,
        supportsMetadata: true,
        supportsImages: true,
        supportsStreaming: false,
        supportsUpload: false,
        supportsDownload: false,
        supportsAuthentication: false,
        supportsOAuth: false,
        supportsWebhooks: false,
        supportsRealtimeUpdates: false,
        supportsRateLimiting: false,
        supportsHealthChecks: true,
        supportsRetry: true,
        supportsCaching: false,
        supportsBatchRequests: false,
        supportsPlugins: false
    };

    public status = "created" as const;

    public async initialize(
        _options: ProviderOptions
    ): Promise<ProviderResult<void>> {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async authenticate() {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async connect() {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async execute<TRequest, TResult>(
        _request: TRequest
    ): Promise<ProviderResult<TResult>> {

        return {
            success: true,
            status: this.status,
            data: undefined,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async health() {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async disconnect() {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

    public async shutdown() {

        return {
            success: true,
            status: this.status,
            durationMs: 0,
            timestamp: new Date()
        };

    }

}